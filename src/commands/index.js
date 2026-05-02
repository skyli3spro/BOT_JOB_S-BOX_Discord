const config = require("./config");
const leaderboard = require("./leaderboard");
const service = require("./service");

const commands = [config, leaderboard, service];
const commandMap = new Map(commands.map((command) => [command.data.name, command]));

module.exports = {
  commandMap,
  commands
};
