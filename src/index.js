require("dotenv").config();

const { Client, Events, GatewayIntentBits } = require("discord.js");
const { getConfig } = require("./config");
const { initDatabase } = require("./db");
const { commandMap } = require("./commands");

async function main() {
  const config = getConfig();
  initDatabase(config.databasePath);

  const client = new Client({
    intents: [GatewayIntentBits.Guilds]
  });

  client.once(Events.ClientReady, (readyClient) => {
    console.log(`Logged in as ${readyClient.user.tag}`);
  });

  client.on(Events.InteractionCreate, async (interaction) => {
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
  });

  await client.login(config.discordToken);
}

main().catch((error) => {
  console.error("Bot startup failed.");
  console.error(error);
  process.exitCode = 1;
});
