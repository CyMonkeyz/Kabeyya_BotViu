const { sendCleanMessage } = require('../services/messages');

const handleUnknown = async (bot, chatId) => {
  await sendCleanMessage(
    bot,
    chatId,
    '*🤔 I did not understand that message.*\n\nPlease use `/start` to see the available commands.',
    { parse_mode: 'Markdown' }
  );
};

module.exports = {
  handleUnknown
};
