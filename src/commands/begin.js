const { PermissionFlagsBits, SlashCommandBuilder } = require("discord.js");
const { getGuildConfig } = require("../services/service-tracker");
const { getGuildLanguage, t } = require("../utils/i18n");

const data = new SlashCommandBuilder()
  .setName("begin")
  .setDescription("Show the recommended steps to configure the bot.")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

async function execute(interaction) {
  const config = getGuildConfig(interaction.guildId);
  const language = getGuildLanguage(config);

  await interaction.reply({
    content: [
      `**${t(language, "beginTitle")}**`,
      t(language, "beginIntro"),
      "",
      `1. \`/config command-channel\` - ${t(language, "beginStepCommandChannel")}`,
      `2. \`/config forum-channel\` - ${t(language, "beginStepForumChannel")}`,
      `3. \`/config report-channel\` - ${t(language, "beginStepReportChannel")}`,
      `4. \`/config report-forum\` - ${t(language, "beginStepReportForum")}`,
      `5. \`/config log-channel\` - ${t(language, "beginStepLogChannel")}`,
      `6. \`/config job-name\` - ${t(language, "beginStepJobName")}`,
      `7. \`/config language\` - ${t(language, "beginStepLanguage")}`,
      `8. \`/config rank-role-add\` - ${t(language, "beginStepRankRoles")}`,
      `9. \`/config training-forum\` - ${t(language, "beginStepTrainingForum")}`,
      `10. \`/config training-role-add\` - ${t(language, "beginStepTrainingRoles")}`,
      `11. \`/guide post\` - ${t(language, "beginStepGuidePost")}`,
      `12. \`/config show\` - ${t(language, "beginStepShow")}`,
      `13. \`/report create\` / \`/report close\` - ${t(language, "beginStepReports")}`,
      `14. \`/service start\`, \`/service stop\`, \`/service status\` - ${t(language, "beginStepTest")}`,
      "",
      t(language, "beginOutro")
    ].join("\n"),
    ephemeral: true
  });
}

module.exports = { data, execute };
