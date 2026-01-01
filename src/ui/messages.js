const { sendCleanMessage, editMessage, sendCleanDocument } = require('../services/messages');
const { buildNavKeyboard } = require('./keyboard');
const { pushState, replaceState, getPreviousStateId } = require('./state');

const buildNavOptions = (chatId, extraButtons) => {
  const backTo = getPreviousStateId(chatId);
  return buildNavKeyboard({ backTo, extraButtons });
};

const sendMessageWithNav = async (
  bot,
  chatId,
  text,
  options = {},
  { stateId, extraButtons, replace = false } = {}
) => {
  if (stateId) {
    if (replace) {
      replaceState(chatId, stateId);
    } else {
      pushState(chatId, stateId);
    }
  }
  const navOptions = buildNavOptions(chatId, extraButtons);
  return sendCleanMessage(bot, chatId, text, { ...options, ...navOptions });
};

const editMessageWithNav = async (
  bot,
  chatId,
  messageId,
  text,
  options = {},
  { stateId, extraButtons, replace = false } = {}
) => {
  if (stateId) {
    if (replace) {
      replaceState(chatId, stateId);
    } else {
      pushState(chatId, stateId);
    }
  }
  const navOptions = buildNavOptions(chatId, extraButtons);
  return editMessage(bot, chatId, messageId, text, { ...options, ...navOptions });
};

const sendDocumentWithNav = async (
  bot,
  chatId,
  document,
  options = {},
  { stateId, extraButtons, replace = false } = {}
) => {
  if (stateId) {
    if (replace) {
      replaceState(chatId, stateId);
    } else {
      pushState(chatId, stateId);
    }
  }
  const navOptions = buildNavOptions(chatId, extraButtons);
  return sendCleanDocument(bot, chatId, document, { ...options, ...navOptions });
};

const sendErrorWithNav = async (bot, chatId, text, stateId = 'home') => {
  const message = text
    || '*⚠️ Terjadi gangguan.*\n\nSilakan coba lagi nanti atau kembali ke menu utama.';
  return sendMessageWithNav(
    bot,
    chatId,
    message,
    { parse_mode: 'Markdown' },
    { stateId, replace: true }
  );
};

module.exports = {
  editMessageWithNav,
  sendDocumentWithNav,
  sendErrorWithNav,
  sendMessageWithNav
};
