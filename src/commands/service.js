const { SlashCommandBuilder } = require("discord.js");
const {
  assertCommandChannel,
  getActiveSessions,
  ensureUserProfile,
  getGuildConfig,
  startService,
  stopService,
  updateProfileThread
} = require("../services/service-tracker");
const {
  formatDiscordTimestamp,
  formatDuration
} = require("../utils/formatters");
const { getLiveServerDisplayName } = require("../utils/members");
const { getGuildLanguage, t } = require("../utils/i18n");
const { replyWithAutoDelete } = require("../utils/interaction-responses");

const data = new SlashCommandBuilder()
  .setName("service")
  .setDescription("Manage on-duty service sessions.")
  .addSubcommand((subcommand) =>
    subcommand.setName("start").setDescription("Start your service session.")
  )
  .addSubcommand((subcommand) =>
    subcommand.setName("stop").setDescription("Stop your current service session.")
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("status")
      .setDescription("Show the agents currently on duty.")
  );

async function execute(interaction) {
  const config = getGuildConfig(interaction.guildId);
  assertCommandChannel(interaction, config);
  const language = getGuildLanguage(config);
  const displayName = await getLiveServerDisplayName(interaction);

  const subcommand = interaction.options.getSubcommand();

  if (subcommand === "start") {
    ensureUserProfile(interaction.guildId, interaction.user.id);
    const result = startService(interaction.guildId, interaction.user.id);

    if (result.alreadyActive) {
      await interaction.reply({
        content: t(language, "serviceAlreadyOnDuty", {
          since: formatDiscordTimestamp(new Date(result.session.started_at))
        }),
        ephemeral: true
      });
      return;
    }

    await updateProfileThread(interaction, t(language, "statusOnDuty"));
    await replyWithAutoDelete(
      interaction,
      t(language, "serviceStarted", {
        displayName,
        startedAt: formatDiscordTimestamp(new Date(result.session.started_at))
      })
    );
    return;
  }

  if (subcommand === "stop") {
    const result = stopService(interaction.guildId, interaction.user.id);

    if (!result.activeSession || !result.completedSession) {
      await interaction.reply({
        content: t(language, "serviceNoActiveSession"),
        ephemeral: true
      });
      return;
    }

    await updateProfileThread(interaction, t(language, "statusOffDuty"));
    await replyWithAutoDelete(
      interaction,
      t(language, "serviceStopped", {
        displayName,
        endedAt: formatDiscordTimestamp(new Date(result.completedSession.ended_at)),
        duration: formatDuration(result.completedSession.duration || 0)
      })
    );
    return;
  }

  const activeSessions = getActiveSessions(interaction.guildId);

  if (activeSessions.length === 0) {
    await interaction.reply({
      content: t(language, "activeAgentsEmpty"),
      ephemeral: true
    });
    return;
  }

  const lines = await Promise.all(
    activeSessions.map(async (session, index) => {
      const member = await interaction.guild.members.fetch(session.user_id).catch(() => null);
      const label =
        member?.displayName || member?.user?.username || session.user_id;

      return `${index + 1}. ${label} - ${t(language, "activeAgentsStartedAt", {
        startedAt: formatDiscordTimestamp(new Date(session.started_at))
      })}`;
    })
  );

  await interaction.reply({
    content: [
      `**${t(language, "activeAgentsTitle")}**`,
      t(language, "activeAgentsCount", { count: activeSessions.length }),
      "",
      ...lines
    ].join("\n"),
    ephemeral: true
  });
}

module.exports = { data, execute };
