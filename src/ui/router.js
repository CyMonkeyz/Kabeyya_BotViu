const { handleStart } = require('../handlers/commands');
const { handleOwnerMenu, renderOwnerPrompt, clearOwnerState } = require('../handlers/ownerMenu');
const { popState, resetState, replaceState } = require('./state');

const renderState = async (bot, chatId, stateId) => {
  switch (stateId) {
    case 'owner_menu':
      await handleOwnerMenu(bot, chatId);
      return;
    case 'owner_add':
      await renderOwnerPrompt(bot, chatId, 'add');
      return;
    case 'owner_extend':
      await renderOwnerPrompt(bot, chatId, 'extend');
      return;
    case 'owner_remove':
      await renderOwnerPrompt(bot, chatId, 'remove');
      return;
    case 'home':
    default:
      await handleStart(bot, chatId);
  }
};

const handleNavCallback = async (bot, query) => {
  const data = query.data || '';
  if (!data.startsWith('nav:')) {
    return false;
  }
  const chatId = query.message.chat.id;

  if (data === 'nav:cancel') {
    clearOwnerState(chatId);
    resetState(chatId);
    await renderState(bot, chatId, 'home');
    return true;
  }

  if (data.startsWith('nav:back')) {
    const targetFromData = data.split(':')[2];
    const popped = popState(chatId);
    if (targetFromData && targetFromData !== popped.id) {
      replaceState(chatId, targetFromData);
    }
    clearOwnerState(chatId);
    await renderState(bot, chatId, targetFromData || popped.id);
    return true;
  }

  return false;
};

module.exports = {
  handleNavCallback,
  renderState
};
