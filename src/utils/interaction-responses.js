const AUTO_DELETE_DELAY_MS = 60_000;

function normalizeReplyPayload(payload) {
  return typeof payload === "string" ? { content: payload } : { ...payload };
}

function scheduleMessageDeletion(message, delayMs = AUTO_DELETE_DELAY_MS) {
  if (!message) {
    return;
  }

  setTimeout(() => {
    message.delete().catch(() => null);
  }, delayMs);
}

async function replyWithAutoDelete(interaction, payload, delayMs = AUTO_DELETE_DELAY_MS) {
  const normalizedPayload = normalizeReplyPayload(payload);
  const isEphemeral = Boolean(normalizedPayload.ephemeral);

  if (!isEphemeral) {
    normalizedPayload.fetchReply = true;
  }

  const message = await interaction.reply(normalizedPayload);

  if (!isEphemeral) {
    scheduleMessageDeletion(message, delayMs);
  }

  return message;
}

module.exports = {
  AUTO_DELETE_DELAY_MS,
  replyWithAutoDelete,
  scheduleMessageDeletion
};
