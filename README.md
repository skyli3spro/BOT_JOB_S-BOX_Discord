# BOT_JOB_S-BOX_Discord

Discord service tracker bot for S&box RP servers.

French version: [README.fr.md](README.fr.md)

## Features

- `/service start`
- `/service stop`
- `/service status`
- `/leaderboard`
- `/help`
- `/begin`
- `/config command-channel`
- `/config forum-channel`
- `/config training-forum`
- `/config job-name`
- `/config language`
- `/config rank-role-add`
- `/config rank-role-remove`
- `/config rank-role-list`
- `/config rank-role-clear`
- `/config training-role-add`
- `/config training-role-remove`
- `/config training-role-list`
- `/config training-role-clear`
- `/config wipe-forum`
- `/config show`
- `/training-guide publish`

## Stack

- Node.js
- discord.js
- SQLite
- `node:sqlite` (built-in Node.js module)

## Installation

1. Copy `.env.example` to `.env`
2. Fill in the bot token, application client ID, and optionally `TEST_GUILD_IDS`
3. Install dependencies with `npm install`
4. Register slash commands with `npm run register`
5. Start the bot with `npm start`

Important:
- `TEST_GUILD_IDS` is optional
- you only need it if you want fast command updates on one or more test servers
- if you leave it empty, the bot can still work on every server where it is invited

## `.env` configuration

Example:

```env
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_application_client_id
TEST_GUILD_IDS=your_first_test_guild_id,your_second_test_guild_id
DATABASE_PATH=./data/service-tracker.db
```

### `DISCORD_TOKEN`

Purpose:
Private bot token used to connect the bot to Discord.

Where to find it:
1. Open the [Discord Developer Portal](https://discord.com/developers/applications)
2. Open your application
3. Go to `Bot`
4. Click `Reset Token` or `Copy`

Important:
- never share this token
- never post it in Discord or on GitHub
- if it leaks, regenerate it immediately

### `DISCORD_CLIENT_ID`

Purpose:
Public application identifier used to register slash commands and build the bot invite link.

Where to find it:
1. Open the [Discord Developer Portal](https://discord.com/developers/applications)
2. Open your application
3. Go to `General Information`
4. Copy `Application ID`

Important:
- this is not a secret
- it is required for `npm run register`

### `TEST_GUILD_IDS`

Purpose:
Comma-separated Discord test server IDs used to register slash commands on specific servers for fast updates.

Do you really need it?
- no, this variable is optional
- use it only during development or testing
- if you do not set it, commands are registered globally for every server where the bot is invited

Where to find it:
1. Enable `Developer Mode` in Discord
2. Go to `User Settings > Advanced`
3. Enable `Developer Mode`
4. Right-click the target server
5. Click `Copy Server ID`

Important:
- recommended during development
- guild commands appear almost instantly
- you can target one or more servers at the same time
- if this value is empty, commands are registered globally and may take longer to update

### `DATABASE_PATH`

Purpose:
Path to the local SQLite database used by the bot.

Recommended value:
`./data/service-tracker.db`

Important:
- the file is created automatically
- it stores server config, user profiles, and service sessions

## Commands

### `/service start`

Starts a service session for the user.

Example:
`/service start`

Use:
- saves the start time
- marks the user as on duty
- updates the forum profile if a forum is configured

### `/service stop`

Ends the current service session.

Example:
`/service stop`

Use:
- saves the end time
- calculates the session duration
- adds the time to the user total
- updates the forum profile if a forum is configured

### `/service status`

Shows the agents currently on duty.

Example:
`/service status`

Use:
- lists the agents currently on duty
- shows when each active session started

### `/leaderboard`

Shows the users with the highest service time.

Example:
`/leaderboard`

Use:
- sorts users by total service time
- helps track member activity

### `/help`

Shows a quick overview of the available commands.

Example:
`/help`

Use:
- shows player commands for everyone
- shows administrator commands when used by a server admin

### `/begin`

Shows the recommended setup order for administrators.

Example:
`/begin`

Use:
- explains how to configure the server step by step
- helps set up channels, forums, language, rank roles, and training roles

### `/config command-channel`

Sets the text channel allowed for service commands.

Example:
`/config command-channel channel:#service`

### `/config forum-channel`

Sets the Discord forum used for user profiles.

Example:
`/config forum-channel channel:#service-profiles`

### `/config training-forum`

Sets the Discord forum used for training guides.

Example:
`/config training-forum channel:#training-guides`

### `/config job-name`

Sets the RP job name shown in profiles.

Example:
`/config job-name value:Police`

### `/config language`

Sets the language used by the bot for messages and forum content.

Example:
`/config language value:fr`

Notes:
- the bot defaults to English
- French is available through this command

## Multi-server usage

One bot instance can be used on multiple Discord servers at the same time.

- invite the same bot to every server you want to use
- each server keeps its own config and data through its own `guild_id`
- for fast development registration, set `TEST_GUILD_IDS` with one or more server IDs separated by commas
- if you want the commands available everywhere without listing server IDs, leave `TEST_GUILD_IDS` empty and register globally
- you do not need to run multiple bot instances just because you use multiple Discord servers

### `/config rank-role-add`

Adds a role to the allowed rank-role list.

Example:
`/config rank-role-add role:@Sergeant`

### `/config rank-role-remove`

Removes a role from the allowed rank-role list.

Example:
`/config rank-role-remove role:@Sergeant`

### `/config rank-role-list`

Shows the roles currently used for rank detection.

Example:
`/config rank-role-list`

### `/config rank-role-clear`

Clears the configured rank-role list.

Example:
`/config rank-role-clear`

### `/config training-role-add`

Adds a role to the list allowed to publish training guides.

Example:
`/config training-role-add role:@Trainer`

### `/config training-role-remove`

Removes a role from the list allowed to publish training guides.

Example:
`/config training-role-remove role:@Trainer`

### `/config training-role-list`

Shows the roles allowed to publish training guides.

Example:
`/config training-role-list`

### `/config training-role-clear`

Clears the list of roles allowed to publish training guides.

Example:
`/config training-role-clear`

### `/config wipe-forum`

Deletes every post in the configured forum and clears stored forum thread links.

Example:
`/config wipe-forum confirmation:CONFIRM`

### `/config show`

Shows the current server configuration.

Example:
`/config show`

### `/training-guide publish`

Creates a new training guide post in the configured training forum from a Markdown file.

Example:
`/training-guide publish file:guide.md title:Traffic Stop Basics`

Notes:
- only configured training roles can use this command
- a common setup is to add both `@Trainer` and `@Staff` with `/config training-role-add`
- the file should be a `.md` guide
- if the file is long, the bot will split it into multiple messages inside the forum post

## Notes

- service commands can be restricted to a dedicated channel with `/config command-channel`
- user profiles can be posted in a Discord forum with `/config forum-channel`
- the bot defaults to English and can be switched with `/config language`
- public bot replies to commands are automatically deleted after 1 minute
- the SQLite database is stored in `./data/service-tracker.db`
- the project targets Node.js 22+ to use `node:sqlite`
