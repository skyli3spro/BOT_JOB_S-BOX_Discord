const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle
} = require("discord.js");
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

function buildReportPanelComponents(language) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("report-panel:create")
        .setLabel(t(language, "reportCreateButton"))
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("report-panel:list")
        .setLabel(t(language, "reportListButton"))
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("report-panel:close")
        .setLabel(t(language, "reportCloseButton"))
        .setStyle(ButtonStyle.Secondary)
    )
  ];
}

function buildCreateReportModal(language) {
  return new ModalBuilder()
    .setCustomId("report-panel:create-submit")
    .setTitle(t(language, "reportCreateModalTitle"))
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("title")
          .setLabel(t(language, "reportCreateTitleField"))
          .setStyle(TextInputStyle.Short)
          .setMaxLength(100)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("subject")
          .setLabel(t(language, "reportCreateSubjectField"))
          .setStyle(TextInputStyle.Short)
          .setMaxLength(100)
          .setRequired(false)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("summary")
          .setLabel(t(language, "reportCreateSummaryField"))
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(1000)
          .setRequired(true)
      )
    );
}

function buildCloseReportModal(language) {
  return new ModalBuilder()
    .setCustomId("report-panel:close-submit")
    .setTitle(t(language, "reportCloseModalTitle"))
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("id")
          .setLabel(t(language, "reportCloseIdField"))
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      )
    );
}

async function executeCreate(interaction, config, language, input) {
  if (!config?.report_forum_channel_id) {
    await interaction.reply({
      content: t(language, "configReportForumNotConfigured"),
      ephemeral: true
    });
    return;
  }

  const title = String(input.title || "").trim();
  const subjectName = String(input.subjectName || "").trim() || null;
  const summary = String(input.summary || "").trim();

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
}

async function executeList(interaction, config, language, status = "all") {
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
}

async function executeClose(interaction, config, language, reportId) {
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

async function execute(interaction) {
  const config = getGuildConfig(interaction.guildId);
  assertReportCommandChannel(interaction, config);
  const language = getGuildLanguage(config);
  const subcommand = interaction.options.getSubcommand();

  if (subcommand === "create") {
    await executeCreate(interaction, config, language, {
      title: interaction.options.getString("title", true),
      subjectName: interaction.options.getString("subject"),
      summary: interaction.options.getString("summary", true)
    });
    return;
  }

  if (subcommand === "list") {
    await executeList(
      interaction,
      config,
      language,
      interaction.options.getString("status") || "all"
    );
    return;
  }

  await executeClose(
    interaction,
    config,
    language,
    interaction.options.getInteger("id", true)
  );
}

async function handlePanelButton(interaction, action) {
  const config = getGuildConfig(interaction.guildId);
  assertReportCommandChannel(interaction, config);
  const language = getGuildLanguage(config);

  if (action === "create") {
    await interaction.showModal(buildCreateReportModal(language));
    return;
  }

  if (action === "close") {
    await interaction.showModal(buildCloseReportModal(language));
    return;
  }

  await executeList(interaction, config, language, "all");
}

async function handleModalSubmit(interaction, action) {
  const config = getGuildConfig(interaction.guildId);
  assertReportCommandChannel(interaction, config);
  const language = getGuildLanguage(config);

  if (action === "create-submit") {
    await executeCreate(interaction, config, language, {
      title: interaction.fields.getTextInputValue("title"),
      subjectName: interaction.fields.getTextInputValue("subject"),
      summary: interaction.fields.getTextInputValue("summary")
    });
    return;
  }

  const rawId = interaction.fields.getTextInputValue("id");
  const reportId = Number.parseInt(String(rawId || "").trim(), 10);

  if (!Number.isInteger(reportId) || reportId < 1) {
    await interaction.reply({
      content: t(language, "reportCloseInvalidId"),
      ephemeral: true
    });
    return;
  }

  await executeClose(interaction, config, language, reportId);
}

module.exports = {
  buildReportPanelComponents,
  data,
  execute,
  handleModalSubmit,
  handlePanelButton
};
