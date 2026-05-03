const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

let db;

function initDatabase(databasePath) {
  if (db) {
    return db;
  }

  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  db = new DatabaseSync(databasePath);
  db.exec("PRAGMA journal_mode = WAL;");

  db.exec(`
    CREATE TABLE IF NOT EXISTS guild_config (
      guild_id TEXT PRIMARY KEY,
      command_channel_id TEXT,
      command_panel_message_id TEXT,
      forum_channel_id TEXT,
      training_forum_channel_id TEXT,
      job_name TEXT,
      language TEXT DEFAULT 'en',
      rank_role_ids TEXT DEFAULT '[]',
      training_role_ids TEXT DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS user_profiles (
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      forum_thread_id TEXT,
      total_time INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (guild_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS service_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      duration INTEGER
    );
  `);

  const guildConfigColumns = db
    .prepare("PRAGMA table_info(guild_config)")
    .all()
    .map((column) => column.name);

  if (!guildConfigColumns.includes("language")) {
    db.exec("ALTER TABLE guild_config ADD COLUMN language TEXT DEFAULT 'en';");
  }

  if (!guildConfigColumns.includes("command_panel_message_id")) {
    db.exec("ALTER TABLE guild_config ADD COLUMN command_panel_message_id TEXT;");
  }

  if (!guildConfigColumns.includes("rank_role_ids")) {
    db.exec("ALTER TABLE guild_config ADD COLUMN rank_role_ids TEXT DEFAULT '[]';");
  }

  if (!guildConfigColumns.includes("training_forum_channel_id")) {
    db.exec("ALTER TABLE guild_config ADD COLUMN training_forum_channel_id TEXT;");
  }

  if (!guildConfigColumns.includes("training_role_ids")) {
    db.exec("ALTER TABLE guild_config ADD COLUMN training_role_ids TEXT DEFAULT '[]';");
  }

  return db;
}

function getDb() {
  if (!db) {
    throw new Error("Database has not been initialized yet.");
  }
  return db;
}

module.exports = {
  getDb,
  initDatabase
};
