const lastBotMessages = new Map();

const safeDelete = async (bot, chatId, messageId) => {
  if (!messageId) {
    return;
  }
  try {
    await bot.deleteMessage(chatId, messageId);
  } catch (error) {
    // Ignore delete errors for stability.
  }
};

const deletePreviousBotMessage = async (bot, chatId) => {
  const previous = lastBotMessages.get(chatId);
  if (previous) {
    await safeDelete(bot, chatId, previous);
    lastBotMessages.delete(chatId);
  }
};

const sendCleanMessage = async (bot, chatId, text, options = {}) => {
  await deletePreviousBotMessage(bot, chatId);
  const message = await bot.sendMessage(chatId, text, options);
  lastBotMessages.set(chatId, message.message_id);
  return message;
};

const sendCleanDocument = async (bot, chatId, document, options = {}) => {
  await deletePreviousBotMessage(bot, chatId);
  const message = await bot.sendDocument(chatId, document, options);
  lastBotMessages.set(chatId, message.message_id);
  return message;
};

const editMessage = async (bot, chatId, messageId, text, options = {}) => {
  await bot.editMessageText(text, { chat_id: chatId, message_id: messageId, ...options });
};

const trackExistingMessage = (chatId, messageId) => {
  lastBotMessages.set(chatId, messageId);
};

const deleteIncomingMessage = async (bot, msg) => {
  try {
    await bot.deleteMessage(msg.chat.id, msg.message_id);
  } catch (error) {
    // Ignore errors.
  }
};

module.exports = {
  deleteIncomingMessage,
  editMessage,
  safeDelete,
  sendCleanDocument,
  sendCleanMessage,
  trackExistingMessage
};
