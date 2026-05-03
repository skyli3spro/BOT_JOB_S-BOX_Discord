const { PermissionFlagsBits, SlashCommandBuilder } = require("discord.js");
const {
  assertReportCommandChannel,
  closeReportEntry,
  createReportEntry,
  getGuildConfig,
  getReportEntryById,
  listReportEntries,
  logStaffEvent,
  syncReportThread
} = require("../services/service-tracker");
const { formatDiscordTimestamp } = require("../utils/formatters");
const {
  getGuildLanguage,
  t
} = require("../utils/i18n");

function truncate(text, maxLength = 120) {
  const normalized = String(text || "").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 3)).trim()}...`;
}

const data = new SlashCommandBuilder()
  .setName("report")
  .setDescription("Create and manage lightweight RP reports.")
  .addSubcommand((subcommand) =>
    subcommand
      .setName("create")
      .setDescription("Create a lightweight RP report.")
      .addStringOption((option) =>
        option
          .setName("title")
          .setDescription("Short report title")
          .setMaxLength(100)
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("summary")
          .setDescription("Short report summary")
          .setMaxLength(1000)
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("subject")
          .setDescription("Person or subject involved in the report")
          .setMaxLength(100)
          .setRequired(false)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("list")
      .setDescription("List recent RP reports.")
      .addStringOption((option) =>
        option
          .setName("status")
          .setDescription("Report status filter")
          .setRequired(false)
          .addChoices(
            { name: "Open", value: "open" },
            { name: "Closed", value: "closed" },
            { name: "All", value: "all" }
          )
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("close")
      .setDescription("Close an existing RP report.")
      .addIntegerOption((option) =>
        option
          .setName("id")
          .setDescription("Report ID to close")
          .setMinValue(1)
          .setRequired(true)
      )
  );

async function execute(interaction) {
  const config = getGuildConfig(interaction.guildId);
  assertReportCommandChannel(interaction, config);
  const language = getGuildLanguage(config);
  const subcommand = interaction.options.getSubcommand();

  if (subcommand === "create") {
    if (!config?.report_forum_channel_id) {
      await interaction.reply({
        content: t(language, "configReportForumNotConfigured"),
        ephemeral: true
      });
      return;
    }

    const title = interaction.options.getString("title", true).trim();
    const subjectName = interaction.options.getString("subject")?.trim() || null;
    const summary = interaction.options.getString("summary", true).trim();

    const report = createReportEntry(interaction.guildId, {
      author_user_id: interaction.user.id,
      title,
      subject_name: subjectName,
      summary
    });
    const thread = await syncReportThread(interaction.guild, config, report);

    await interaction.reply({
      content: t(language, "reportCreateSuccess", {
        id: report.id,
        thread: thread ? `<#${thread.id}>` : t(language, "configNotSet")
      }),
      ephemeral: true
    });

    await logStaffEvent(interaction.guild, config, {
      title: t(language, "staffLogReportTitle"),
      description: t(language, "reportCreateLog", {
        author: interaction.user,
        id: report.id,
        title,
        subject: subjectName || t(language, "reportNoSubject"),
        thread: thread ? `<#${thread.id}>` : t(language, "configNotSet")
      }),
      color: 0x5865f2
    });
    return;
  }

  if (subcommand === "list") {
    const status = interaction.options.getString("status") || "all";
    const reports = listReportEntries(interaction.guildId, status, 10);

    if (reports.length === 0) {
      await interaction.reply({
        content: t(language, "reportListEmpty"),
        ephemeral: true
      });
      return;
    }

    const lines = reports.map((report) => {
      const createdAt = formatDiscordTimestamp(new Date(report.created_at));
      const subject = report.subject_name || t(language, "reportNoSubject");
      const statusLabel = t(
        language,
        report.status === "closed" ? "reportStatusClosed" : "reportStatusOpen"
      );
      const threadLabel = report.thread_id
        ? `<#${report.thread_id}>`
        : t(language, "configNotSet");

      return [
        `#${report.id} - **${report.title}**`,
        `${t(language, "reportSubjectLabel")}: ${subject}`,
        `${t(language, "reportStatusLabel")}: ${statusLabel}`,
        `${t(language, "reportCreatedAtLabel")}: ${createdAt}`,
        `${t(language, "reportThreadLabel")}: ${threadLabel}`,
        `${t(language, "reportSummaryLabel")}: ${truncate(report.summary)}`
      ].join("\n");
    });

    await interaction.reply({
      content: [
        `**${t(language, "reportListTitle")}**`,
        "",
        lines.join("\n\n")
      ].join("\n"),
      ephemeral: true
    });
    return;
  }

  const reportId = interaction.options.getInteger("id", true);
  const report = getReportEntryById(interaction.guildId, reportId);

  if (!report) {
    await interaction.reply({
      content: t(language, "reportCloseNotFound", { id: reportId }),
      ephemeral: true
    });
    return;
  }

  const canClose =
    report.author_user_id === interaction.user.id
    || interaction.memberPermissions?.has(PermissionFlagsBits.Administrator);

  if (!canClose) {
    await interaction.reply({
      content: t(language, "reportCloseDenied"),
      ephemeral: true
    });
    return;
  }

  if (report.status === "closed") {
    await interaction.reply({
      content: t(language, "reportAlreadyClosed", { id: reportId }),
      ephemeral: true
    });
    return;
  }

  const closedReport = closeReportEntry(
    interaction.guildId,
    reportId,
    interaction.user.id
  );
  await syncReportThread(interaction.guild, config, closedReport, {
    createIfMissing: false
  });

  await interaction.reply({
    content: t(language, "reportCloseSuccess", { id: reportId }),
    ephemeral: true
  });

  await logStaffEvent(interaction.guild, config, {
    title: t(language, "staffLogReportTitle"),
    description: t(language, "reportCloseLog", {
      actor: interaction.user,
      id: closedReport.id,
      title: closedReport.title
    }),
    color: 0x7f8c8d
  });
}

module.exports = { data, execute };
