const { PermissionFlagsBits, SlashCommandBuilder } = require("discord.js");
const {
  assertCommandChannel,
  getActiveSessions,
  ensureUserProfile,
  getGuildConfig,
  logStaffEvent,
  startService,
  stopService,
  updateProfileThread,
  updateProfileThreadForUser
} = require("../services/service-tracker");
const {
  formatDiscordTimestamp,
  formatDuration
} = require("../utils/formatters");
const {
  getLiveServerDisplayName,
  getServerDisplayNameByUserId
} = require("../utils/members");
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
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("force-stop")
      .setDescription("Force-stop another user's active service session.")
      .addUserOption((option) =>
        option
          .setName("user")
          .setDescription("User whose active service session should be stopped")
          .setRequired(true)
      )
  );

async function executeServiceAction(interaction, subcommand) {
  const config = getGuildConfig(interaction.guildId);
  assertCommandChannel(interaction, config);
  const language = getGuildLanguage(config);
  const displayName = await getLiveServerDisplayName(interaction);

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
    await logStaffEvent(interaction.guild, config, {
      title: t(language, "staffLogServiceTitle"),
      description: t(language, "serviceStarted", {
        displayName,
        startedAt: formatDiscordTimestamp(new Date(result.session.started_at))
      }),
      color: 0x2b9348
    });
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
    await logStaffEvent(interaction.guild, config, {
      title: t(language, "staffLogServiceTitle"),
      description: t(language, "serviceStopped", {
        displayName,
        endedAt: formatDiscordTimestamp(new Date(result.completedSession.ended_at)),
        duration: formatDuration(result.completedSession.duration || 0)
      }),
      color: 0xd35454
    });
    return;
  }

  if (subcommand === "force-stop") {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        content: t(language, "serviceForceStopDenied"),
        ephemeral: true
      });
      return;
    }

    const targetUser = interaction.options.getUser("user", true);
    const result = stopService(interaction.guildId, targetUser.id);

    if (!result.activeSession || !result.completedSession) {
      await interaction.reply({
        content: t(language, "serviceForceStopNoActive", { user: targetUser }),
        ephemeral: true
      });
      return;
    }

    const targetDisplayName = await getServerDisplayNameByUserId(
      interaction.guild,
      targetUser.id
    );
    await updateProfileThreadForUser(
      interaction.guild,
      interaction.guildId,
      targetUser.id,
      t(language, "statusOffDuty")
    );

    const message = t(language, "serviceForceStopped", {
      actor: interaction.user,
      displayName: targetDisplayName,
      endedAt: formatDiscordTimestamp(new Date(result.completedSession.ended_at)),
      duration: formatDuration(result.completedSession.duration || 0)
    });

    await replyWithAutoDelete(interaction, message);
    await logStaffEvent(interaction.guild, config, {
      title: t(language, "staffLogServiceTitle"),
      description: message,
      color: 0xe67e22
    });
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

async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();
  await executeServiceAction(interaction, subcommand);
}

async function handlePanelButton(interaction, action) {
  await executeServiceAction(interaction, action);
}

module.exports = { data, execute, handlePanelButton };
