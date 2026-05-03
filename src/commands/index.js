const begin = require("./begin");
const config = require("./config");
const guide = require("./guide");
const help = require("./help");
const leaderboard = require("./leaderboard");
const report = require("./report");
const service = require("./service");
const trainingGuide = require("./training-guide");

const commands = [
  begin,
  config,
  guide,
  help,
  leaderboard,
  report,
  service,
  trainingGuide
];
const commandMap = new Map(commands.map((command) => [command.data.name, command]));

module.exports = {
  commandMap,
  commands
};
