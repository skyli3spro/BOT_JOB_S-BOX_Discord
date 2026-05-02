const {
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder
} = require("discord.js");
const {
  getConfiguredRankRoleIds,
  getGuildConfig,
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
      .setName("show")
      .setDescription("Show the current configuration.")
  );

async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();
  const currentConfig = getGuildConfig(interaction.guildId);
  const currentLanguage = getGuildLanguage(currentConfig);
  const configuredRankRoleIds = getConfiguredRankRoleIds(currentConfig);

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
        }`
      ].join("\n"),
      ephemeral: true
    });
    return;
  }

  if (subcommand === "command-channel") {
    const channel = interaction.options.getChannel("channel", true);
    upsertGuildConfig(interaction.guildId, {
      command_channel_id: channel.id,
      language: currentLanguage
    });
    await interaction.reply({
      content: t(currentLanguage, "configCommandChannelSaved", {
        channel
      }),
      ephemeral: true
    });
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
    return;
  }

  if (subcommand === "job-name") {
    const value = interaction.options.getString("value", true);
    upsertGuildConfig(interaction.guildId, {
      job_name: value,
      language: currentLanguage
    });
    await interaction.reply({
      content: t(currentLanguage, "configJobNameSaved", { value }),
      ephemeral: true
    });
    return;
  }

  if (subcommand === "language") {
    const value = normalizeLanguage(
      interaction.options.getString("value", true)
    );
    upsertGuildConfig(interaction.guildId, {
      language: value
    });

    await interaction.reply({
      content: t(value, "configLanguageSaved", {
        languageLabel: getLanguageLabel(value, value)
      }),
      ephemeral: true
    });
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
  }
}

module.exports = { data, execute };
