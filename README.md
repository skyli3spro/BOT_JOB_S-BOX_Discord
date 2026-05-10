# BOT_JOB_S-BOX_Discord

Discord service tracker bot for S&box RP servers.

French version: [README.fr.md](README.fr.md)

## Features

- `/service start`
- `/service stop`
- `/service status`
- `/service force-stop`
- `/leaderboard`
- `/report create`
- `/report list`
- `/report close`
- `/help`
- `/begin`
- `/guide post`
- `/config command-channel`
- `/config forum-channel`
- `/config report-channel`
- `/config report-forum`
- `/config training-forum`
- `/config log-channel`
- `/config job-name`
- `/config language`
- `/config rank-role-add`
- `/config rank-role-remove`
- `/config rank-role-list`
- `/config rank-role-clear`
- `/config rank-nickname-sync`
- `/config training-role-add`
- `/config training-role-remove`
- `/config training-role-list`
- `/config training-role-clear`
- `/config wipe-forum`
- `/config reset-user-data`
- `/config reset-job-data`
- `/config reset-all-data`
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
- enable the `Server Members Intent` in the Discord Developer Portal if you want automatic rank nicknames
- give the bot the `Manage Nicknames` permission
- place the bot role above the members it must rename

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

### `/service force-stop`

Force-stops another user's active service session.

Example:
`/service force-stop user:@Agent`

Use:
- administrator-only
- useful when someone forgot to end their shift
- updates the profile and total time correctly

### `/leaderboard`

Shows the users with the highest service time.

Example:
`/leaderboard`

Use:
- sorts users by total service time
- helps track member activity

### `/report create`

Creates a lightweight RP report and opens a tracking post in the report forum.

Example:
`/report create title:Traffic stop subject:John Doe summary:Short summary here`

### `/report list`

Lists recent reports.

Example:
`/report list status:open`

### `/report close`

Closes a report by its ID and marks the forum tracking post as closed.

Example:
`/report close id:12`

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

### `/guide post`

Posts a built-in guide message in the selected channel.

Example:
`/guide post type:service channel:#service-help`

Use:
- posts a ready-to-use guide for `service`, `admin`, `training`, `report`, or `role-request`
- automatically pins the message when the bot can pin messages
- helps staff avoid re-explaining the same commands repeatedly

Example for a role request template:
`/guide post type:role-request channel:#role-request role:@ASPD`

### `/config command-channel`

Sets the text channel allowed for service commands.

Example:
`/config command-channel channel:#service`

Notes:
- updates the pinned service panel in that channel
- the panel includes buttons for `Start`, `Stop`, `Status`, and `Leaderboard`

### `/config forum-channel`

Sets the Discord forum used for user profiles.

Example:
`/config forum-channel channel:#service-profiles`

### `/config report-channel`

Sets the allowed channel for report commands.

Example:
`/config report-channel channel:#police-reports`

### `/config report-forum`

Sets the forum used to track each report.

Example:
`/config report-forum channel:#police-report-tracking`

### `/config training-forum`

Sets the Discord forum used for training guides.

Example:
`/config training-forum channel:#training-guides`

### `/config log-channel`

Sets the text channel used for staff logs.

Example:
`/config log-channel channel:#staff-logs`

Use:
- logs service starts and stops
- logs guide publications
- logs report activity
- logs configuration changes

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

Notes:
- use this if only specific job ranks should count for the displayed rank
- do not add staff or moderation roles here
- if you want automatic rank prefixes in nicknames, configure these roles first and then enable `/config rank-nickname-sync`

### `/config rank-nickname-sync`

Enables or disables automatic nickname sync with the configured job rank.

Example:
`/config rank-nickname-sync value:enabled`

Notes:
- the bot uses only the roles added through `/config rank-role-add`
- when enabled, the bot prefixes the member server nickname with the highest configured rank
- when disabled, the bot removes the known rank prefixes it previously added

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

### `/config reset-user-data`

Deletes all service data for one user on the current server.

Example:
`/config reset-user-data user:@Agent confirmation:CONFIRM`

Notes:
- deletes the user's sessions and profile data
- tries to delete the user's forum profile thread too

### `/config reset-job-data`

Deletes all service data for the current server job while keeping the server configuration.

Example:
`/config reset-job-data confirmation:CONFIRM`

Notes:
- deletes every session and every profile for this server
- keeps the configured channels, language, and role settings

### `/config reset-all-data`

Deletes the complete bot database.

Example:
`/config reset-all-data confirmation:RESET-ALL`

Notes:
- deletes all sessions, profiles, and server configurations
- use this only when you really want a full reset everywhere

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

### Suggested guide flow

If you want players and staff to learn the bot without asking for help every time:

- post a `service` guide in the main service channel with `/guide post`
- post an `admin` guide in a staff or management channel
- post a `training` guide in a staff/training information channel
- post a `report` guide in a staff or police-information channel
- if the file is long, the bot will split it into multiple messages inside the forum post

## Notes

- service commands can be restricted to a dedicated channel with `/config command-channel`
- user profiles can be posted in a Discord forum with `/config forum-channel`
- the bot defaults to English and can be switched with `/config language`
- public bot replies to commands are automatically deleted after 1 minute
- the SQLite database is stored in `./data/service-tracker.db`
- the project targets Node.js 22+ to use `node:sqlite`
