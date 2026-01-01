const TelegramBot = require('node-telegram-bot-api');
const figlet = require('figlet');
const colors = require('@colors/colors');

const { token, botName, isOwner } = require('./settings');
const { isAuthorized } = require('./services/accessControl');
const { checkRateLimit } = require('./services/antiSpam');
const { deleteIncomingMessage } = require('./services/messages');
const { handleClaim, handleStart, handleUnauthorized } = require('./handlers/commands');
const { handleOwnerCallback, handleOwnerInput, handleOwnerMenu } = require('./handlers/ownerMenu');
const { handleUnknown } = require('./handlers/unknown');
const { handleNavCallback } = require('./ui/router');
const { sendErrorWithNav, sendMessageWithNav } = require('./ui/messages');
const { getCurrentState } = require('./ui/state');

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

  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled promise rejection:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
  });

  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    try {
      await bot.answerCallbackQuery(query.id);
      const handledNav = await handleNavCallback(bot, query);
      if (handledNav) {
        return;
      }
      await handleOwnerCallback(bot, query);
    } catch (error) {
      const currentState = getCurrentState(chatId);
      await sendErrorWithNav(
        bot,
        chatId,
        '*⚠️ Terjadi kesalahan saat memproses aksi.*\n\nSilakan coba lagi nanti.',
        currentState.id
      );
    }
  });

  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
      await deleteIncomingMessage(bot, msg);

      const rateLimit = checkRateLimit(userId);
      if (rateLimit.limited) {
        const currentState = getCurrentState(chatId);
        await sendMessageWithNav(
          bot,
          chatId,
          '*⚠️ Mohon pelan sedikit.*\n\nKami membatasi pesan cepat agar layanan tetap stabil.',
          { parse_mode: 'Markdown' },
          { stateId: currentState.id, replace: true }
        );
        return;
      }

      const authorization = isAuthorized(userId);
      if (!authorization.allowed) {
        await handleUnauthorized(bot, chatId);
        return;
      }

      if (msg.document || msg.photo || msg.video || msg.audio || msg.voice || msg.sticker) {
        const currentState = getCurrentState(chatId);
        await sendMessageWithNav(
          bot,
          chatId,
          '*🛡️ Upload file diblokir demi keamanan.*\n\nSilakan kirim perintah teks saja.',
          { parse_mode: 'Markdown' },
          { stateId: currentState.id, replace: true }
        );
        return;
      }

      if (isOwner(userId)) {
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
        if (!isOwner(userId)) {
          const currentState = getCurrentState(chatId);
          await sendMessageWithNav(
            bot,
            chatId,
            '*🚫 Khusus owner.*\n\nSilakan hubungi owner untuk bantuan.',
            { parse_mode: 'Markdown' },
            { stateId: currentState.id, replace: true }
          );
          return;
        }
        await handleOwnerMenu(bot, chatId);
        return;
      }

      if (text.startsWith('/claim')) {
        await handleClaim(bot, msg);
        return;
      }

      await handleUnknown(bot, chatId);
    } catch (error) {
      const currentState = getCurrentState(chatId);
      await sendErrorWithNav(
        bot,
        chatId,
        '*⚠️ Terjadi kesalahan saat memproses pesan.*\n\nSilakan coba lagi nanti.',
        currentState.id
      );
    }
  });
};

start();

module.exports = bot;
