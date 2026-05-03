const begin = require("./begin");
const config = require("./config");
const help = require("./help");
const leaderboard = require("./leaderboard");
const service = require("./service");
const trainingGuide = require("./training-guide");

const commands = [begin, config, help, leaderboard, service, trainingGuide];
const commandMap = new Map(commands.map((command) => [command.data.name, command]));

module.exports = {
  commandMap,
  commands
};
