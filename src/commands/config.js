const {
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder
} = require("discord.js");
const {
  getConfiguredTrainingRoleIds,
  getConfiguredRankRoleIds,
  getGuildConfig,
  logStaffEvent,
  resetAllServiceData,
  resetGuildServiceData,
  resetUserServiceData,
  syncCommandGuideMessage,
  upsertGuildConfig,
  wipeConfiguredForum
} = require("../services/service-tracker");
const {
  DEFAULT_LANGUAGE,
  getGuildLanguage,
  getLanguageLabel,
  isValidWipeConfirmation,
  normalizeLanguage,
  t
} = require("../utils/i18n");

const STANDARD_RESET_CONFIRMATIONS = ["CONFIRM", "CONFIRMER"];
const FULL_RESET_CONFIRMATIONS = ["RESET-ALL", "REINITIALISER-TOUT"];

function matchesConfirmation(value, allowedValues) {
  const normalizedValue = String(value || "").trim().toUpperCase();
  return allowedValues.includes(normalizedValue);
}

async function logConfigMutation(interaction, config, content) {
  const language = getGuildLanguage(config);
  await logStaffEvent(interaction.guild, config, {
    title: t(language, "staffLogConfigTitle"),
    description: content
  });
}

const data = new SlashCommandBuilder()
  .setName("config")
  .setDescription("Configure the service bot for this server.")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand((subcommand) =>
    subcommand
      .setName("command-channel")
      .setDescription("Set the allowed channel for service commands.")
      .addChannelOption((option) =>
        option
          .setName("channel")
          .setDescription("Text channel for service commands")
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("forum-channel")
      .setDescription("Set the forum used for user profiles.")
      .addChannelOption((option) =>
        option
          .setName("channel")
          .setDescription("Forum used for service profiles")
          .addChannelTypes(ChannelType.GuildForum)
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("report-channel")
      .setDescription("Set the allowed channel for report commands.")
      .addChannelOption((option) =>
        option
          .setName("channel")
          .setDescription("Text channel for report commands")
          .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("report-forum")
      .setDescription("Set the forum used for report tracking.")
      .addChannelOption((option) =>
        option
          .setName("channel")
          .setDescription("Forum used for report tracking")
          .addChannelTypes(ChannelType.GuildForum)
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("training-forum")
      .setDescription("Set the forum used for training guides.")
      .addChannelOption((option) =>
        option
          .setName("channel")
          .setDescription("Forum used for training guides")
          .addChannelTypes(ChannelType.GuildForum)
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("log-channel")
      .setDescription("Set the staff log channel used by the bot.")
      .addChannelOption((option) =>
        option
          .setName("channel")
          .setDescription("Text channel used for staff logs")
          .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("job-name")
      .setDescription("Set the RP job name displayed on profiles.")
      .addStringOption((option) =>
        option
          .setName("value")
          .setDescription("RP job name")
          .setMaxLength(100)
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("language")
      .setDescription("Set the language used by the bot.")
      .addStringOption((option) =>
        option
          .setName("value")
          .setDescription("Language for bot messages")
          .setRequired(true)
          .addChoices(
            { name: "French", value: "fr" },
            { name: "English", value: "en" }
          )
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("rank-role-add")
      .setDescription("Add a role to the allowed rank-role list.")
      .addRoleOption((option) =>
        option
          .setName("role")
          .setDescription("Role used for ranks")
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("rank-role-remove")
      .setDescription("Remove a role from the allowed rank-role list.")
      .addRoleOption((option) =>
        option
          .setName("role")
          .setDescription("Role used for ranks")
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("rank-role-list")
      .setDescription("Show the roles currently used for ranks.")
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("rank-role-clear")
      .setDescription("Clear the configured rank-role list.")
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("training-role-add")
      .setDescription("Add a role to the list allowed to publish guides.")
      .addRoleOption((option) =>
        option
          .setName("role")
          .setDescription("Role allowed to publish training guides")
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("training-role-remove")
      .setDescription("Remove a role from the list allowed to publish guides.")
      .addRoleOption((option) =>
        option
          .setName("role")
          .setDescription("Role allowed to publish training guides")
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("training-role-list")
      .setDescription("Show the roles allowed to publish guides.")
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("training-role-clear")
      .setDescription("Clear the roles allowed to publish guides.")
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("wipe-forum")
      .setDescription("Delete every post in the configured forum.")
      .addStringOption((option) =>
        option
          .setName("confirmation")
          .setDescription("Type CONFIRM to validate the forum wipe")
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("reset-user-data")
      .setDescription("Delete all service data for one user.")
      .addUserOption((option) =>
        option
          .setName("user")
          .setDescription("User whose service data should be deleted")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("confirmation")
          .setDescription("Type CONFIRM to validate the user data reset")
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("reset-job-data")
      .setDescription("Delete all service data for this server job.")
      .addStringOption((option) =>
        option
          .setName("confirmation")
          .setDescription("Type CONFIRM to validate the server job reset")
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("reset-all-data")
      .setDescription("Delete the complete bot database.")
      .addStringOption((option) =>
        option
          .setName("confirmation")
          .setDescription("Type RESET-ALL to validate the full database reset")
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("show")
      .setDescription("Show the current configuration.")
  );

async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();
  const currentConfig = getGuildConfig(interaction.guildId);
  const currentLanguage = getGuildLanguage(currentConfig);
  const configuredRankRoleIds = getConfiguredRankRoleIds(currentConfig);
  const configuredTrainingRoleIds = getConfiguredTrainingRoleIds(currentConfig);

  if (subcommand === "show") {
    const config = currentConfig;
    if (!config) {
      await interaction.reply({
        content: t(currentLanguage, "configShowEmpty"),
        ephemeral: true
      });
      return;
    }

    await interaction.reply({
      content: [
        `${t(currentLanguage, "configLabelCommandChannel")}: ${
          config.command_channel_id
            ? `<#${config.command_channel_id}>`
            : t(currentLanguage, "configNotSet")
        }`,
        `${t(currentLanguage, "configLabelForumChannel")}: ${
          config.forum_channel_id
            ? `<#${config.forum_channel_id}>`
            : t(currentLanguage, "configNotSet")
        }`,
        `${t(currentLanguage, "configLabelReportChannel")}: ${
          config.report_channel_id
            ? `<#${config.report_channel_id}>`
            : t(currentLanguage, "configNotSet")
        }`,
        `${t(currentLanguage, "configLabelReportForumChannel")}: ${
          config.report_forum_channel_id
            ? `<#${config.report_forum_channel_id}>`
            : t(currentLanguage, "configNotSet")
        }`,
        `${t(currentLanguage, "configLabelTrainingForumChannel")}: ${
          config.training_forum_channel_id
            ? `<#${config.training_forum_channel_id}>`
            : t(currentLanguage, "configNotSet")
        }`,
        `${t(currentLanguage, "configLabelLogChannel")}: ${
          config.log_channel_id
            ? `<#${config.log_channel_id}>`
            : t(currentLanguage, "configNotSet")
        }`,
        `${t(currentLanguage, "configLabelJobName")}: ${
          config.job_name || t(currentLanguage, "configNotSet")
        }`,
        `${t(currentLanguage, "configLabelLanguage")}: ${getLanguageLabel(
          config.language || DEFAULT_LANGUAGE,
          currentLanguage
        )}`,
        `${t(currentLanguage, "configLabelRankRoles")}: ${
          configuredRankRoleIds.length > 0
            ? configuredRankRoleIds.map((roleId) => `<@&${roleId}>`).join(", ")
            : t(currentLanguage, "configAllRolesAllowed")
        }`,
        `${t(currentLanguage, "configLabelTrainingRoles")}: ${
          configuredTrainingRoleIds.length > 0
            ? configuredTrainingRoleIds.map((roleId) => `<@&${roleId}>`).join(", ")
            : t(currentLanguage, "configTrainingRolesDefault")
        }`
      ].join("\n"),
      ephemeral: true
    });
    return;
  }

  if (subcommand === "command-channel") {
    const channel = interaction.options.getChannel("channel", true);
    const nextConfig = upsertGuildConfig(interaction.guildId, {
      command_channel_id: channel.id,
      command_panel_message_id: null,
      language: currentLanguage
    });
    await syncCommandGuideMessage(interaction.guild, nextConfig);
    await interaction.reply({
      content: t(currentLanguage, "configCommandChannelSaved", {
        channel
      }),
      ephemeral: true
    });
    await logConfigMutation(
      interaction,
      nextConfig,
      t(currentLanguage, "configCommandChannelSaved", { channel })
    );
    return;
  }

  if (subcommand === "forum-channel") {
    const channel = interaction.options.getChannel("channel", true);
    upsertGuildConfig(interaction.guildId, {
      forum_channel_id: channel.id,
      language: currentLanguage
    });
    await interaction.reply({
      content: t(currentLanguage, "configForumChannelSaved", {
        channel
      }),
      ephemeral: true
    });
    await logConfigMutation(
      interaction,
      getGuildConfig(interaction.guildId),
      t(currentLanguage, "configForumChannelSaved", { channel })
    );
    return;
  }

  if (subcommand === "report-channel") {
    const channel = interaction.options.getChannel("channel", true);
    upsertGuildConfig(interaction.guildId, {
      report_channel_id: channel.id,
      language: currentLanguage
    });
    await interaction.reply({
      content: t(currentLanguage, "configReportChannelSaved", {
        channel
      }),
      ephemeral: true
    });
    await logConfigMutation(
      interaction,
      getGuildConfig(interaction.guildId),
      t(currentLanguage, "configReportChannelSaved", { channel })
    );
    return;
  }

  if (subcommand === "report-forum") {
    const channel = interaction.options.getChannel("channel", true);
    upsertGuildConfig(interaction.guildId, {
      report_forum_channel_id: channel.id,
      language: currentLanguage
    });
    await interaction.reply({
      content: t(currentLanguage, "configReportForumChannelSaved", {
        channel
      }),
      ephemeral: true
    });
    await logConfigMutation(
      interaction,
      getGuildConfig(interaction.guildId),
      t(currentLanguage, "configReportForumChannelSaved", { channel })
    );
    return;
  }

  if (subcommand === "training-forum") {
    const channel = interaction.options.getChannel("channel", true);
    upsertGuildConfig(interaction.guildId, {
      training_forum_channel_id: channel.id,
      language: currentLanguage
    });
    await interaction.reply({
      content: t(currentLanguage, "configTrainingForumChannelSaved", {
        channel
      }),
      ephemeral: true
    });
    await logConfigMutation(
      interaction,
      getGuildConfig(interaction.guildId),
      t(currentLanguage, "configTrainingForumChannelSaved", { channel })
    );
    return;
  }

  if (subcommand === "log-channel") {
    const channel = interaction.options.getChannel("channel", true);
    const nextConfig = upsertGuildConfig(interaction.guildId, {
      log_channel_id: channel.id,
      language: currentLanguage
    });
    const message = t(currentLanguage, "configLogChannelSaved", { channel });
    await interaction.reply({
      content: message,
      ephemeral: true
    });
    await logConfigMutation(interaction, nextConfig, message);
    return;
  }

  if (subcommand === "job-name") {
    const value = interaction.options.getString("value", true);
    const nextConfig = upsertGuildConfig(interaction.guildId, {
      job_name: value,
      language: currentLanguage
    });
    await syncCommandGuideMessage(interaction.guild, nextConfig);
    await interaction.reply({
      content: t(currentLanguage, "configJobNameSaved", { value }),
      ephemeral: true
    });
    await logConfigMutation(
      interaction,
      nextConfig,
      t(currentLanguage, "configJobNameSaved", { value })
    );
    return;
  }

  if (subcommand === "language") {
    const value = normalizeLanguage(
      interaction.options.getString("value", true)
    );
    const nextConfig = upsertGuildConfig(interaction.guildId, {
      language: value
    });
    await syncCommandGuideMessage(interaction.guild, nextConfig);

    await interaction.reply({
      content: t(value, "configLanguageSaved", {
        languageLabel: getLanguageLabel(value, value)
      }),
      ephemeral: true
    });
    await logConfigMutation(
      interaction,
      nextConfig,
      t(value, "configLanguageSaved", {
        languageLabel: getLanguageLabel(value, value)
      })
    );
    return;
  }

  if (subcommand === "rank-role-add") {
    const role = interaction.options.getRole("role", true);
    if (configuredRankRoleIds.includes(role.id)) {
      await interaction.reply({
        content: t(currentLanguage, "configRankRoleAlreadyPresent", { role }),
        ephemeral: true
      });
      return;
    }

    upsertGuildConfig(interaction.guildId, {
      rank_role_ids: [...configuredRankRoleIds, role.id],
      language: currentLanguage
    });
    await interaction.reply({
      content: t(currentLanguage, "configRankRoleAddSaved", { role }),
      ephemeral: true
    });
    await logConfigMutation(
      interaction,
      getGuildConfig(interaction.guildId),
      t(currentLanguage, "configRankRoleAddSaved", { role })
    );
    return;
  }

  if (subcommand === "rank-role-remove") {
    const role = interaction.options.getRole("role", true);
    if (!configuredRankRoleIds.includes(role.id)) {
      await interaction.reply({
        content: t(currentLanguage, "configRankRoleNotPresent", { role }),
        ephemeral: true
      });
      return;
    }

    upsertGuildConfig(interaction.guildId, {
      rank_role_ids: configuredRankRoleIds.filter((roleId) => roleId !== role.id),
      language: currentLanguage
    });
    await interaction.reply({
      content: t(currentLanguage, "configRankRoleRemoveSaved", { role }),
      ephemeral: true
    });
    await logConfigMutation(
      interaction,
      getGuildConfig(interaction.guildId),
      t(currentLanguage, "configRankRoleRemoveSaved", { role })
    );
    return;
  }

  if (subcommand === "rank-role-list") {
    await interaction.reply({
      content:
        configuredRankRoleIds.length > 0
          ? `${t(currentLanguage, "configRankRoleListTitle")}\n${configuredRankRoleIds
              .map((roleId) => `- <@&${roleId}>`)
              .join("\n")}`
          : t(currentLanguage, "configRankRoleListEmpty"),
      ephemeral: true
    });
    return;
  }

  if (subcommand === "rank-role-clear") {
    upsertGuildConfig(interaction.guildId, {
      rank_role_ids: [],
      language: currentLanguage
    });
    await interaction.reply({
      content: t(currentLanguage, "configRankRoleClearSaved"),
      ephemeral: true
    });
    await logConfigMutation(
      interaction,
      getGuildConfig(interaction.guildId),
      t(currentLanguage, "configRankRoleClearSaved")
    );
    return;
  }

  if (subcommand === "training-role-add") {
    const role = interaction.options.getRole("role", true);
    if (configuredTrainingRoleIds.includes(role.id)) {
      await interaction.reply({
        content: t(currentLanguage, "configTrainingRoleAlreadyPresent", { role }),
        ephemeral: true
      });
      return;
    }

    upsertGuildConfig(interaction.guildId, {
      training_role_ids: [...configuredTrainingRoleIds, role.id],
      language: currentLanguage
    });
    await interaction.reply({
      content: t(currentLanguage, "configTrainingRoleAddSaved", { role }),
      ephemeral: true
    });
    await logConfigMutation(
      interaction,
      getGuildConfig(interaction.guildId),
      t(currentLanguage, "configTrainingRoleAddSaved", { role })
    );
    return;
  }

  if (subcommand === "training-role-remove") {
    const role = interaction.options.getRole("role", true);
    if (!configuredTrainingRoleIds.includes(role.id)) {
      await interaction.reply({
        content: t(currentLanguage, "configTrainingRoleNotPresent", { role }),
        ephemeral: true
      });
      return;
    }

    upsertGuildConfig(interaction.guildId, {
      training_role_ids: configuredTrainingRoleIds.filter((roleId) => roleId !== role.id),
      language: currentLanguage
    });
    await interaction.reply({
      content: t(currentLanguage, "configTrainingRoleRemoveSaved", { role }),
      ephemeral: true
    });
    await logConfigMutation(
      interaction,
      getGuildConfig(interaction.guildId),
      t(currentLanguage, "configTrainingRoleRemoveSaved", { role })
    );
    return;
  }

  if (subcommand === "training-role-list") {
    await interaction.reply({
      content:
        configuredTrainingRoleIds.length > 0
          ? `${t(currentLanguage, "configTrainingRoleListTitle")}\n${configuredTrainingRoleIds
              .map((roleId) => `- <@&${roleId}>`)
              .join("\n")}`
          : t(currentLanguage, "configTrainingRoleListEmpty"),
      ephemeral: true
    });
    return;
  }

  if (subcommand === "training-role-clear") {
    upsertGuildConfig(interaction.guildId, {
      training_role_ids: [],
      language: currentLanguage
    });
    await interaction.reply({
      content: t(currentLanguage, "configTrainingRoleClearSaved"),
      ephemeral: true
    });
    await logConfigMutation(
      interaction,
      getGuildConfig(interaction.guildId),
      t(currentLanguage, "configTrainingRoleClearSaved")
    );
    return;
  }

  if (subcommand === "wipe-forum") {
    const confirmation = interaction.options.getString("confirmation", true);

    if (!currentConfig?.forum_channel_id) {
      await interaction.reply({
        content: t(currentLanguage, "configForumNotConfigured"),
        ephemeral: true
      });
      return;
    }

    if (!isValidWipeConfirmation(currentLanguage, confirmation)) {
      await interaction.reply({
        content: t(currentLanguage, "configWipeForumConfirmationInvalid"),
        ephemeral: true
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });
    await interaction.editReply({
      content: t(currentLanguage, "configWipeForumStarted")
    });

    const result = await wipeConfiguredForum(interaction.guild, currentConfig);
    await interaction.editReply({
      content: t(currentLanguage, "configWipeForumCompleted", {
        deletedCount: result?.deletedCount || 0,
        failedCount: result?.failedCount || 0
      })
    });
    await logConfigMutation(
      interaction,
      currentConfig,
      t(currentLanguage, "configWipeForumCompleted", {
        deletedCount: result?.deletedCount || 0,
        failedCount: result?.failedCount || 0
      })
    );
    return;
  }

  if (subcommand === "reset-user-data") {
    const user = interaction.options.getUser("user", true);
    const confirmation = interaction.options.getString("confirmation", true);

    if (!matchesConfirmation(confirmation, STANDARD_RESET_CONFIRMATIONS)) {
      await interaction.reply({
        content: t(currentLanguage, "configResetUserConfirmationInvalid"),
        ephemeral: true
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });
    await interaction.editReply({
      content: t(currentLanguage, "configResetUserStarted", { user })
    });

    const result = await resetUserServiceData(
      interaction.guild,
      interaction.guildId,
      user.id
    );

    await interaction.editReply({
      content: t(currentLanguage, "configResetUserCompleted", {
        deletedProfileThreads: result.deletedProfileThreads,
        deletedProfiles: result.deletedProfiles,
        deletedSessions: result.deletedSessions,
        user
      })
    });
    await logConfigMutation(
      interaction,
      currentConfig,
      t(currentLanguage, "configResetUserCompleted", {
        deletedProfileThreads: result.deletedProfileThreads,
        deletedProfiles: result.deletedProfiles,
        deletedSessions: result.deletedSessions,
        user
      })
    );
    return;
  }

  if (subcommand === "reset-job-data") {
    const confirmation = interaction.options.getString("confirmation", true);

    if (!matchesConfirmation(confirmation, STANDARD_RESET_CONFIRMATIONS)) {
      await interaction.reply({
        content: t(currentLanguage, "configResetJobConfirmationInvalid"),
        ephemeral: true
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });
    await interaction.editReply({
      content: t(currentLanguage, "configResetJobStarted")
    });

    const result = await resetGuildServiceData(
      interaction.guild,
      interaction.guildId
    );

    await interaction.editReply({
      content: t(currentLanguage, "configResetJobCompleted", {
        deletedProfileThreads: result.deletedProfileThreads,
        deletedProfiles: result.deletedProfiles,
        deletedSessions: result.deletedSessions
      })
    });
    await logConfigMutation(
      interaction,
      currentConfig,
      t(currentLanguage, "configResetJobCompleted", {
        deletedProfileThreads: result.deletedProfileThreads,
        deletedProfiles: result.deletedProfiles,
        deletedSessions: result.deletedSessions
      })
    );
    return;
  }

  if (subcommand === "reset-all-data") {
    const confirmation = interaction.options.getString("confirmation", true);

    if (!matchesConfirmation(confirmation, FULL_RESET_CONFIRMATIONS)) {
      await interaction.reply({
        content: t(currentLanguage, "configResetAllConfirmationInvalid"),
        ephemeral: true
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });
    await interaction.editReply({
      content: t(currentLanguage, "configResetAllStarted")
    });

    const result = await resetAllServiceData(interaction.client);

    await interaction.editReply({
      content: t(currentLanguage, "configResetAllCompleted", {
        deletedConfigs: result.deletedConfigs,
        deletedProfileThreads: result.deletedProfileThreads,
        deletedProfiles: result.deletedProfiles,
        deletedSessions: result.deletedSessions
      })
    });
    return;
  }
}

module.exports = { data, execute };
