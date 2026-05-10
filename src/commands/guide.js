const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder
} = require("discord.js");
const {
  getGuildConfig,
  logStaffEvent
} = require("../services/service-tracker");
const { buildReportPanelComponents } = require("./report");
const { getGuildLanguage, t } = require("../utils/i18n");

const GUIDE_TYPES = {
  service: 0x2b9348,
  admin: 0x2f6ed3,
  training: 0xc27c0e,
  report: 0x5865f2,
  "role-request": 0xe08a1e
};

function getChannelLabel(channelId, fallback) {
  return channelId ? `<#${channelId}>` : fallback;
}

function buildServiceGuideEmbed(language, config) {
  const commandChannelLabel = getChannelLabel(
    config?.command_channel_id,
    t(language, "guideNotConfigured")
  );

  return new EmbedBuilder()
    .setColor(GUIDE_TYPES.service)
    .setTitle(t(language, "guideServiceTitle"))
    .setDescription(t(language, "guideServiceDescription", {
      channel: commandChannelLabel
    }))
    .addFields({
      name: t(language, "guideServiceNotesField"),
      value: t(language, "guideServiceNotesValue")
    })
    .setFooter({ text: t(language, "guideServiceFooter") });
}

function buildAdminGuideEmbed(language, config) {
  const commandChannelLabel = getChannelLabel(
    config?.command_channel_id,
    t(language, "guideNotConfigured")
  );
  const forumChannelLabel = getChannelLabel(
    config?.forum_channel_id,
    t(language, "guideNotConfigured")
  );
  const reportChannelLabel = getChannelLabel(
    config?.report_channel_id,
    t(language, "guideNotConfigured")
  );
  const reportForumLabel = getChannelLabel(
    config?.report_forum_channel_id,
    t(language, "guideNotConfigured")
  );
  const logChannelLabel = getChannelLabel(
    config?.log_channel_id,
    t(language, "guideNotConfigured")
  );
  const trainingForumLabel = getChannelLabel(
    config?.training_forum_channel_id,
    t(language, "guideNotConfigured")
  );

  return new EmbedBuilder()
    .setColor(GUIDE_TYPES.admin)
    .setTitle(t(language, "guideAdminTitle"))
    .setDescription(t(language, "guideAdminDescription"))
    .addFields(
      {
        name: t(language, "guideAdminSetupField"),
        value: [
          `1. \`/config command-channel\` - ${t(language, "guideAdminSetupCommandChannel", {
            channel: commandChannelLabel
          })}`,
          `2. \`/config forum-channel\` - ${t(language, "guideAdminSetupForumChannel", {
            channel: forumChannelLabel
          })}`,
          `3. \`/config report-channel\` - ${t(language, "guideAdminSetupReportChannel", {
            channel: reportChannelLabel
          })}`,
          `4. \`/config report-forum\` - ${t(language, "guideAdminSetupReportForum", {
            channel: reportForumLabel
          })}`,
          `5. \`/config log-channel\` - ${t(language, "guideAdminSetupLogChannel", {
            channel: logChannelLabel
          })}`,
          `6. \`/config job-name\` - ${t(language, "guideAdminSetupJobName")}`,
          `7. \`/config language\` - ${t(language, "guideAdminSetupLanguage")}`,
          `8. \`/config rank-role-add\` - ${t(language, "guideAdminSetupRankRoles")}`,
          `9. \`/config training-forum\` - ${t(language, "guideAdminSetupTrainingForum", {
            channel: trainingForumLabel
          })}`,
          `10. \`/config training-role-add\` - ${t(language, "guideAdminSetupTrainingRoles")}`,
          `11. \`/config show\` - ${t(language, "guideAdminSetupShow")}`
        ].join("\n")
      },
      {
        name: t(language, "guideAdminHelpersField"),
        value: [
          `- \`/begin\` - ${t(language, "guideAdminHelpersBegin")}`,
          `- \`/help\` - ${t(language, "guideAdminHelpersHelp")}`,
          `- \`/guide post\` - ${t(language, "guideAdminHelpersGuide")}`,
          `- \`/config reset-...\` - ${t(language, "guideAdminHelpersReset")}`
        ].join("\n")
      }
    )
    .setFooter({ text: t(language, "guideAdminFooter") });
}

function buildTrainingGuideEmbed(language, config) {
  const trainingForumLabel = getChannelLabel(
    config?.training_forum_channel_id,
    t(language, "guideNotConfigured")
  );

  return new EmbedBuilder()
    .setColor(GUIDE_TYPES.training)
    .setTitle(t(language, "guideTrainingTitle"))
    .setDescription(t(language, "guideTrainingDescription", {
      forum: trainingForumLabel
    }))
    .addFields(
      {
        name: t(language, "guideTrainingAccessField"),
        value: t(language, "guideTrainingAccessValue")
      },
      {
        name: t(language, "guideTrainingPublishField"),
        value: [
          `1. ${t(language, "guideTrainingPublishStepConfigureForum")}`,
          `2. ${t(language, "guideTrainingPublishStepConfigureRoles")}`,
          `3. ${t(language, "guideTrainingPublishStepPrepareMarkdown")}`,
          `4. \`/training-guide publish file:guide.md title:...\` - ${t(language, "guideTrainingPublishStepRunCommand")}`
        ].join("\n")
      },
      {
        name: t(language, "guideTrainingMarkdownField"),
        value: t(language, "guideTrainingMarkdownValue")
      }
    )
    .setFooter({ text: t(language, "guideTrainingFooter") });
}

function buildReportGuideEmbed(language) {
  return new EmbedBuilder()
    .setColor(GUIDE_TYPES.report)
    .setTitle(t(language, "guideReportTitle"))
    .setDescription(t(language, "guideReportDescription"))
    .addFields({
      name: t(language, "guideReportNotesField"),
      value: t(language, "guideReportNotesValue")
    })
    .setFooter({ text: t(language, "guideReportFooter") });
}

function buildRoleRequestGuideEmbed(language, role) {
  const roleLabel = role ? `${role}` : "@ASPD";

  return new EmbedBuilder()
    .setColor(GUIDE_TYPES["role-request"])
    .setTitle(t(language, "guideRoleRequestTitle"))
    .setDescription(t(language, "guideRoleRequestDescription", {
      role: roleLabel
    }))
    .addFields({
      name: t(language, "guideRoleRequestFieldTitle"),
      value: t(language, "guideRoleRequestFieldValue", {
        role: roleLabel
      })
    })
    .setFooter({ text: t(language, "guideRoleRequestFooter") });
}

function getGuideTypeKey(type) {
  if (type === "role-request") {
    return "guideTypeRoleRequest";
  }

  return `guideType${type[0].toUpperCase()}${type.slice(1)}`;
}

function buildGuideEmbed(type, language, config, options = {}) {
  if (type === "service") {
    return buildServiceGuideEmbed(language, config);
  }

  if (type === "admin") {
    return buildAdminGuideEmbed(language, config);
  }

  if (type === "report") {
    return buildReportGuideEmbed(language);
  }

  if (type === "role-request") {
    return buildRoleRequestGuideEmbed(language, options.role);
  }

  return buildTrainingGuideEmbed(language, config);
}

function buildGuideComponents(type, language) {
  if (type === "report") {
    return buildReportPanelComponents(language);
  }

  if (type === "service") {
    return [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("service-panel:start")
          .setLabel(t(language, "commandGuideStartButton"))
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("service-panel:stop")
          .setLabel(t(language, "commandGuideStopButton"))
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId("service-panel:status")
          .setLabel(t(language, "commandGuideStatusButton"))
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("service-panel:leaderboard")
          .setLabel(t(language, "commandGuideLeaderboardButton"))
          .setStyle(ButtonStyle.Secondary)
      )
    ];
  }

  return [];
}

const data = new SlashCommandBuilder()
  .setName("guide")
  .setDescription("Post a built-in guide message in a channel.")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand((subcommand) =>
    subcommand
      .setName("post")
      .setDescription("Post a guide in the selected channel.")
      .addStringOption((option) =>
        option
          .setName("type")
          .setDescription("Guide type to post")
          .setRequired(true)
          .addChoices(
            { name: "Service", value: "service" },
            { name: "Admin", value: "admin" },
            { name: "Training", value: "training" },
            { name: "Report", value: "report" },
            { name: "Role request", value: "role-request" }
          )
      )
      .addChannelOption((option) =>
        option
          .setName("channel")
          .setDescription("Text channel where the guide should be posted")
          .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
          .setRequired(true)
      )
      .addRoleOption((option) =>
        option
          .setName("role")
          .setDescription("Role to mention in the guide when needed")
          .setRequired(false)
      )
  );

async function execute(interaction) {
  const config = getGuildConfig(interaction.guildId);
  const language = getGuildLanguage(config);
  const type = interaction.options.getString("type", true);
  const channel = interaction.options.getChannel("channel", true);
  const role = interaction.options.getRole("role");

  try {
    const embed = buildGuideEmbed(type, language, config, { role });
    const message = await channel.send({
      embeds: [embed],
      components: buildGuideComponents(type, language)
    });
    await message.pin().catch(() => null);

    await interaction.reply({
      content: t(language, "guidePostSuccess", {
        type: t(language, getGuideTypeKey(type)),
        channel
      }),
      ephemeral: true
    });
    await logStaffEvent(interaction.guild, config, {
      title: t(language, "staffLogGuideTitle"),
      description: t(language, "guidePostLog", {
        author: interaction.user,
        type: t(language, getGuideTypeKey(type)),
        channel
      }),
      color: 0x2f6ed3
    });
  } catch {
    await interaction.reply({
      content: t(language, "guidePostFailure", { channel }),
      ephemeral: true
    });
  }
}

module.exports = { data, execute };
