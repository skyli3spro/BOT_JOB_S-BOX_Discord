const { SlashCommandBuilder } = require("discord.js");
const {
  canManageTrainingGuides,
  getGuildConfig,
  logStaffEvent,
  publishTrainingGuide
} = require("../services/service-tracker");
const { getGuildLanguage, t } = require("../utils/i18n");

function isMarkdownAttachment(attachment) {
  const name = (attachment?.name || "").toLowerCase();
  const contentType = (attachment?.contentType || "").toLowerCase();

  return name.endsWith(".md")
    || contentType.includes("markdown")
    || contentType.startsWith("text/plain");
}

function deriveGuideTitle(attachmentName, providedTitle, fallbackTitle) {
  const title = String(providedTitle || "").trim();
  if (title) {
    return title;
  }

  const name = String(attachmentName || "").replace(/\.[^.]+$/, "").trim();
  return name || fallbackTitle;
}

async function fetchAttachmentText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("fetch_failed");
  }

  return response.text();
}

const data = new SlashCommandBuilder()
  .setName("training-guide")
  .setDescription("Publish a training guide in the configured forum.")
  .addSubcommand((subcommand) =>
    subcommand
      .setName("publish")
      .setDescription("Create a new training guide from a Markdown file.")
      .addAttachmentOption((option) =>
        option
          .setName("file")
          .setDescription("Markdown file for the guide")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("title")
          .setDescription("Training guide title")
          .setMaxLength(100)
          .setRequired(false)
      )
  );

async function execute(interaction) {
  const config = getGuildConfig(interaction.guildId);
  const language = getGuildLanguage(config);
  const member = interaction.member;

  if (!canManageTrainingGuides(member, config)) {
    await interaction.reply({
      content: t(language, "trainingGuidePermissionDenied"),
      ephemeral: true
    });
    return;
  }

  const attachment = interaction.options.getAttachment("file", true);
  if (!config?.training_forum_channel_id) {
    await interaction.reply({
      content: t(language, "configTrainingForumNotConfigured"),
      ephemeral: true
    });
    return;
  }

  if (!isMarkdownAttachment(attachment)) {
    await interaction.reply({
      content: t(language, "trainingGuideInvalidFile"),
      ephemeral: true
    });
    return;
  }

  const title = deriveGuideTitle(
    attachment.name,
    interaction.options.getString("title"),
    t(language, "trainingGuideThreadFallbackTitle")
  );

  await interaction.deferReply({ ephemeral: true });
  await interaction.editReply({
    content: t(language, "trainingGuidePublishStarted")
  });

  try {
    const markdownContent = await fetchAttachmentText(attachment.url);
    const thread = await publishTrainingGuide(interaction.guild, config, {
      title,
      markdownContent
    });

    await interaction.editReply({
      content: t(language, "trainingGuidePublishSuccess", { thread })
    });
    await logStaffEvent(interaction.guild, config, {
      title: t(language, "staffLogGuideTitle"),
      description: t(language, "trainingGuidePublishLog", {
        author: interaction.user,
        thread,
        title
      }),
      color: 0xc27c0e
    });
  } catch (error) {
    const messageKey =
      error?.message === "fetch_failed"
        ? "trainingGuideFetchFailed"
        : "trainingGuidePublishFailure";

    await interaction.editReply({
      content: t(language, messageKey)
    });
  }
}

module.exports = { data, execute };
