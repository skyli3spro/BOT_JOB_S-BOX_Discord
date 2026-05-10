const { SlashCommandBuilder } = require("discord.js");
const {
  assertCommandChannel,
  getGuildConfig,
  getLeaderboard
} = require("../services/service-tracker");
const { formatDuration } = require("../utils/formatters");
const { getGuildLanguage, t } = require("../utils/i18n");
const { replyWithAutoDelete } = require("../utils/interaction-responses");

const data = new SlashCommandBuilder()
  .setName("leaderboard")
  .setDescription("Show the top service times for this server.");

async function executeLeaderboard(interaction) {
  const config = getGuildConfig(interaction.guildId);
  assertCommandChannel(interaction, config);
  const language = getGuildLanguage(config);

  const entries = getLeaderboard(interaction.guildId, 10);
  if (entries.length === 0) {
    await interaction.reply({
      content: t(language, "leaderboardEmpty"),
      ephemeral: true
    });
    return;
  }

  const lines = await Promise.all(
    entries.map(async (entry, index) => {
      const member = await interaction.guild.members.fetch(entry.user_id).catch(() => null);
      const label =
        member?.displayName || member?.user?.username || entry.user_id;
      return `${index + 1}. ${label} - ${formatDuration(
        entry.total_time || 0
      )}`;
    })
  );

  await replyWithAutoDelete(interaction, {
    content: `${t(language, "leaderboardTitle")}\n${lines.join("\n")}`
  });
}

async function execute(interaction) {
  await executeLeaderboard(interaction);
}

async function handlePanelButton(interaction) {
  await executeLeaderboard(interaction);
}

module.exports = { data, execute, handlePanelButton };
