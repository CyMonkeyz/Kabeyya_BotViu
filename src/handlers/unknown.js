const { sendMessageWithNav } = require('../ui/messages');
const { getCurrentState } = require('../ui/state');

const handleUnknown = async (bot, chatId) => {
  const currentState = getCurrentState(chatId);
  await sendMessageWithNav(
    bot,
    chatId,
    '*🤔 Saya tidak memahami pesan itu.*\n\nGunakan `/start` untuk melihat perintah yang tersedia.',
    { parse_mode: 'Markdown' },
    { stateId: currentState.id, replace: true }
  );
};

module.exports = {
  handleUnknown
};
