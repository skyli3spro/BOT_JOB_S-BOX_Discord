const { SlashCommandBuilder } = require("discord.js");
const {
  assertCommandChannel,
  ensureUserProfile,
  getGuildConfig,
  getOpenSession,
  getUserProfile,
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
    subcommand.setName("status").setDescription("Show your current service status.")
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
        duration: formatDuration(result.completedSession.duration || 0)
      })
    );
    return;
  }

  const profile = getUserProfile(interaction.guildId, interaction.user.id);
  const openSession = getOpenSession(interaction.guildId, interaction.user.id);

  await interaction.reply({
    content: [
      `${t(language, "statusLabel")}: ${
        openSession ? t(language, "statusOnDuty") : t(language, "statusOffDuty")
      }`,
      `${t(language, "currentSessionLabel")}: ${
        openSession
          ? t(language, "currentSessionStarted", {
              startedAt: formatDiscordTimestamp(new Date(openSession.started_at))
            })
          : t(language, "currentSessionNone")
      }`,
      `${t(language, "totalTimeLabel")}: ${formatDuration(
        profile?.total_time || 0
      )}`
    ].join("\n"),
    ephemeral: true
  });
}

module.exports = { data, execute };
