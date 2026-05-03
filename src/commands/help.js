const { PermissionFlagsBits, SlashCommandBuilder } = require("discord.js");
const { getGuildConfig } = require("../services/service-tracker");
const { getGuildLanguage, t } = require("../utils/i18n");

const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("Show an overview of the available bot commands.");

async function execute(interaction) {
  const config = getGuildConfig(interaction.guildId);
  const language = getGuildLanguage(config);
  const isAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.Administrator);

  const lines = [
    `**${t(language, "helpUserCommandsTitle")}**`,
    `- \`/service start\` - ${t(language, "helpServiceStart")}`,
    `- \`/service stop\` - ${t(language, "helpServiceStop")}`,
    `- \`/service status\` - ${t(language, "helpServiceStatus")}`,
    `- \`/leaderboard\` - ${t(language, "helpLeaderboard")}`,
    `- \`/help\` - ${t(language, "helpHelpCommand")}`
  ];

  if (isAdmin) {
    lines.push(
      "",
      `**${t(language, "helpAdminCommandsTitle")}**`,
      `- \`/begin\` - ${t(language, "helpBeginCommand")}`,
      `- \`/config command-channel\` - ${t(language, "helpConfigCommandChannel")}`,
      `- \`/config forum-channel\` - ${t(language, "helpConfigForumChannel")}`,
      `- \`/config job-name\` - ${t(language, "helpConfigJobName")}`,
      `- \`/config language\` - ${t(language, "helpConfigLanguage")}`,
      `- \`/config show\` - ${t(language, "helpConfigShow")}`,
      `- \`/config rank-role-add\` - ${t(language, "helpConfigRankRoles")}`,
      `- \`/config training-forum\` - ${t(language, "helpConfigTrainingForum")}`,
      `- \`/config training-role-add\` - ${t(language, "helpConfigTrainingRoles")}`,
      `- \`/config wipe-forum\` - ${t(language, "helpConfigWipeForum")}`,
      `- \`/training-guide publish\` - ${t(language, "helpTrainingGuide")}`
    );
  } else {
    lines.push("", t(language, "helpAdminHint"));
  }

  await interaction.reply({
    content: [`**${t(language, "helpTitle")}**`, "", ...lines].join("\n"),
    ephemeral: true
  });
}

module.exports = { data, execute };
