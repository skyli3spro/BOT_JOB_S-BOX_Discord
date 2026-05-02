function formatDuration(totalSeconds) {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function formatDiscordTimestamp(date) {
  const epoch = Math.floor(date.getTime() / 1000);
  return `<t:${epoch}:f>`;
}

module.exports = {
  formatDuration,
  formatDiscordTimestamp
};
