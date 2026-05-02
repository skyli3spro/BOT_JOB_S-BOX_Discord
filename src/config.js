const path = require("path");

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parseGuildIds(rawValue) {
  if (!rawValue) {
    return [];
  }

  return [...new Set(
    rawValue
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  )];
}

function getConfig() {
  const testGuildIds = parseGuildIds(
    process.env.TEST_GUILD_IDS || process.env.TEST_GUILD_ID || ""
  );

  return {
    discordToken: requireEnv("DISCORD_TOKEN"),
    clientId: requireEnv("DISCORD_CLIENT_ID"),
    testGuildIds,
    databasePath: path.resolve(
      process.cwd(),
      process.env.DATABASE_PATH || "./data/service-tracker.db"
    )
  };
}

module.exports = { getConfig };
