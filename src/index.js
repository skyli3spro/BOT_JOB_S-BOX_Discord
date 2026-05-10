require("dotenv").config();

const { Client, Events, GatewayIntentBits } = require("discord.js");
const { getConfig } = require("./config");
const { initDatabase } = require("./db");
const { commandMap } = require("./commands");
const leaderboardCommand = require("./commands/leaderboard");
const reportCommand = require("./commands/report");
const serviceCommand = require("./commands/service");
const {
  getGuildConfig,
  hasAnyAutoRankNicknameSyncEnabled,
  syncGuildRankNicknames,
  syncMemberRankNickname
} = require("./services/service-tracker");

function isDisallowedIntentsError(error) {
  return String(error?.message || "").includes("Used disallowed intents");
}

function buildClient(useGuildMembersIntent) {
  const intents = [GatewayIntentBits.Guilds];

  if (useGuildMembersIntent) {
    intents.push(GatewayIntentBits.GuildMembers);
  }

  return new Client({ intents });
}

function registerClientHandlers(client, options = {}) {
  const runtimeHasGuildMembersIntent = Boolean(options.useGuildMembersIntent);

  async function handleInteractionError(interaction, error) {
    console.error(`Error while executing interaction ${interaction.type}`);
    console.error(error);

    const payload = {
      content: error.message || "An unexpected error occurred.",
      ephemeral: true
    };

    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(payload).catch(() => null);
    } else {
      await interaction.reply(payload).catch(() => null);
    }
  }

  client.once(Events.ClientReady, async (readyClient) => {
    console.log(`Logged in as ${readyClient.user.tag}`);

    if (!runtimeHasGuildMembersIntent) {
      return;
    }

    for (const guild of readyClient.guilds.cache.values()) {
      try {
        const guildConfig = getGuildConfig(guild.id);
        if (!guildConfig) {
          continue;
        }

        const result = await syncGuildRankNicknames(guild, guildConfig);
        if (result.updatedCount > 0) {
          console.log(
            `Rank nickname sync updated ${result.updatedCount} member(s) in guild ${guild.id}.`
          );
        }
      } catch (error) {
        console.error(`Error while running initial rank nickname sync for guild ${guild.id}`);
        console.error(error);
      }
    }
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isButton()) {
      const [scope, action] = String(interaction.customId || "").split(":");
      try {
        if (scope === "service-panel") {
          if (action === "leaderboard") {
            await leaderboardCommand.handlePanelButton(interaction);
            return;
          }

          if (["start", "stop", "status"].includes(action)) {
            await serviceCommand.handlePanelButton(interaction, action);
          }
          return;
        }

        if (scope === "report-panel") {
          await reportCommand.handlePanelButton(interaction, action);
        }
      } catch (error) {
        await handleInteractionError(interaction, error);
      }
      return;
    }

    if (interaction.isModalSubmit()) {
      const [scope, action] = String(interaction.customId || "").split(":");
      if (scope !== "report-panel") {
        return;
      }

      try {
        await reportCommand.handleModalSubmit(interaction, action);
      } catch (error) {
        await handleInteractionError(interaction, error);
      }
      return;
    }

    if (!interaction.isChatInputCommand()) {
      return;
    }

    const command = commandMap.get(interaction.commandName);
    if (!command) {
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Error while executing /${interaction.commandName}`);
      await handleInteractionError(interaction, error);
    }
  });

  if (runtimeHasGuildMembersIntent) {
    client.on(Events.GuildMemberUpdate, async (_oldMember, newMember) => {
      try {
        const guildConfig = getGuildConfig(newMember.guild.id);
        if (!guildConfig) {
          return;
        }

        await syncMemberRankNickname(newMember, guildConfig);
      } catch (error) {
        console.error(`Error while syncing nickname for member ${newMember.id}`);
        console.error(error);
      }
    });
  }
}

async function main() {
  const config = getConfig();
  initDatabase(config.databasePath);
  const needsGuildMembersIntent = hasAnyAutoRankNicknameSyncEnabled();
  let client = buildClient(needsGuildMembersIntent);
  registerClientHandlers(client, {
    useGuildMembersIntent: needsGuildMembersIntent
  });

  try {
    await client.login(config.discordToken);
  } catch (error) {
    if (!needsGuildMembersIntent || !isDisallowedIntentsError(error)) {
      throw error;
    }

    console.warn(
      "Guild Members intent is not enabled in the Discord Developer Portal. "
      + "The bot will continue without automatic rank nickname sync."
    );

    client.removeAllListeners();
    client.destroy();

    client = buildClient(false);
    registerClientHandlers(client, {
      useGuildMembersIntent: false
    });
    await client.login(config.discordToken);
  }
}

main().catch((error) => {
  console.error("Bot startup failed.");
  console.error(error);
  process.exitCode = 1;
});
