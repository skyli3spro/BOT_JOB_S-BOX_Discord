require("dotenv").config();

const { REST, Routes } = require("discord.js");
const { getConfig } = require("./config");
const { commands } = require("./commands");

async function main() {
  const config = getConfig();
  const rest = new REST({ version: "10" }).setToken(config.discordToken);
  const body = commands.map((command) => command.data.toJSON());

  if (config.testGuildIds.length > 0) {
    for (const guildId of config.testGuildIds) {
      await rest.put(
        Routes.applicationGuildCommands(config.clientId, guildId),
        { body }
      );
      console.log(`Registered ${body.length} guild command(s) for ${guildId}.`);
    }

    return;
  }

  await rest.put(Routes.applicationCommands(config.clientId), { body });
  console.log(`Registered ${body.length} global command(s).`);
}

main().catch((error) => {
  console.error("Command registration failed.");
  console.error(error);
  process.exitCode = 1;
});
