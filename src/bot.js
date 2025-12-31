const TelegramBot = require('node-telegram-bot-api');
const figlet = require('figlet');
const colors = require('@colors/colors');

const { token, botName, ownerId } = require('./settings');
const { isAuthorized } = require('./services/accessControl');
const { checkRateLimit } = require('./services/antiSpam');
const { deleteIncomingMessage, sendCleanMessage } = require('./services/messages');
const { handleClaim, handleStart, handleUnauthorized } = require('./handlers/commands');
const { handleOwnerCallback, handleOwnerInput, handleOwnerMenu } = require('./handlers/ownerMenu');
const { handleUnknown } = require('./handlers/unknown');

const bot = new TelegramBot(token, { polling: true });

const start = () => {
  console.log(
    colors.white(
      figlet.textSync(botName, {
        horizontalLayout: 'fitted'
      })
    )
  );
  console.log(colors.yellow('Server Running!'));

  bot.on('callback_query', async (query) => {
    try {
      await bot.answerCallbackQuery(query.id);
      await handleOwnerCallback(bot, query);
    } catch (error) {
      // Swallow errors to avoid leaking details.
    }
  });

  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    await deleteIncomingMessage(bot, msg);

    const rateLimit = checkRateLimit(userId);
    if (rateLimit.limited) {
      await sendCleanMessage(
        bot,
        chatId,
        '*⚠️ Please slow down.*\n\nWe are limiting rapid messages to keep the service stable.',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const authorization = isAuthorized(userId);
    if (!authorization.allowed) {
      await handleUnauthorized(bot, chatId);
      return;
    }

    if (msg.document || msg.photo || msg.video || msg.audio || msg.voice || msg.sticker) {
      await sendCleanMessage(
        bot,
        chatId,
        '*🛡️ File uploads are blocked for security.*\n\nPlease send text commands only.',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    if (userId === ownerId) {
      const handledOwnerInput = await handleOwnerInput(bot, msg);
      if (handledOwnerInput) {
        return;
      }
    }

    const text = msg.text || '';
    if (text.startsWith('/start')) {
      await handleStart(bot, chatId);
      return;
    }

    if (text.startsWith('/ownermenu')) {
      if (userId !== ownerId) {
        await sendCleanMessage(
          bot,
          chatId,
          '*🚫 Owner access only.*\n\nPlease contact the owner for assistance.',
          { parse_mode: 'Markdown' }
        );
        return;
      }
      await handleOwnerMenu(bot, msg);
      return;
    }

    if (text.startsWith('/claim')) {
      await handleClaim(bot, msg);
      return;
    }

    await handleUnknown(bot, chatId);
  });
};

start();

module.exports = bot;
