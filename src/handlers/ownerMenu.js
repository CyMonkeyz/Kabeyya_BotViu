const { escapeMarkdown, formatDuration } = require('../utils/text');
const { listUsers, removeUser, upsertUser } = require('../services/userStore');
const { ownerId } = require('../settings');
const { sendCleanMessage } = require('../services/messages');

const ownerStates = new Map();

const buildMenu = () => ({
  reply_markup: {
    inline_keyboard: [
      [
        { text: '➕ Add User', callback_data: 'owner_add' },
        { text: '⏱️ Extend User', callback_data: 'owner_extend' }
      ],
      [
        { text: '➖ Remove User', callback_data: 'owner_remove' },
        { text: '📋 List Users', callback_data: 'owner_list' }
      ],
      [{ text: '✅ Close', callback_data: 'owner_close' }]
    ]
  },
  parse_mode: 'Markdown'
});

const menuText = '*🛡️ Owner Control Panel*\n\nSelect an action below to manage access.';

const handleOwnerMenu = async (bot, msg) => {
  await sendCleanMessage(bot, msg.chat.id, menuText, buildMenu());
};

const handleOwnerCallback = async (bot, query) => {
  const chatId = query.message.chat.id;
  if (query.from.id !== ownerId) {
    return;
  }

  if (query.data === 'owner_list') {
    const users = listUsers();
    const lines = Object.entries(users).map(([userId, data]) => {
      const expiresAt = formatDuration(data.expiresAt);
      return `• \`${escapeMarkdown(userId)}\` — _${escapeMarkdown(expiresAt)}_`;
    });
    const body = lines.length ? lines.join('\n') : '_No registered users yet._';
    await sendCleanMessage(bot, chatId, `*📋 Registered Users*\n\n${body}`, buildMenu());
    return;
  }

  if (query.data === 'owner_close') {
    ownerStates.delete(chatId);
    await sendCleanMessage(bot, chatId, '*✅ Panel closed.*', { parse_mode: 'Markdown' });
    return;
  }

  if (query.data === 'owner_add') {
    ownerStates.set(chatId, { mode: 'add' });
    await sendCleanMessage(
      bot,
      chatId,
      '*➕ Add Access*\n\nSend the user ID and duration in days.\nExample: `123456789 30`',
      { parse_mode: 'Markdown' }
    );
    return;
  }

  if (query.data === 'owner_extend') {
    ownerStates.set(chatId, { mode: 'extend' });
    await sendCleanMessage(
      bot,
      chatId,
      '*⏱️ Extend Access*\n\nSend the user ID and additional days.\nExample: `123456789 7`',
      { parse_mode: 'Markdown' }
    );
    return;
  }

  if (query.data === 'owner_remove') {
    ownerStates.set(chatId, { mode: 'remove' });
    await sendCleanMessage(
      bot,
      chatId,
      '*➖ Remove Access*\n\nSend the user ID to remove.\nExample: `123456789`',
      { parse_mode: 'Markdown' }
    );
  }
};

const handleOwnerInput = async (bot, msg) => {
  const chatId = msg.chat.id;
  if (!ownerStates.has(chatId)) {
    return false;
  }
  const state = ownerStates.get(chatId);
  const text = (msg.text || '').trim();

  if (state.mode === 'remove') {
    const userId = text;
    if (!/^[0-9]+$/.test(userId)) {
      await sendCleanMessage(bot, chatId, '*⚠️ Please send a valid numeric user ID.*', {
        parse_mode: 'Markdown'
      });
      return true;
    }
    const removed = removeUser(userId);
    const message = removed
      ? `*✅ Removed* user \`${escapeMarkdown(userId)}\`.`
      : `*ℹ️ User* \`${escapeMarkdown(userId)}\` *was not found.*`;
    ownerStates.delete(chatId);
    await sendCleanMessage(bot, chatId, message, buildMenu());
    return true;
  }

  const [userId, daysInput] = text.split(/\s+/);
  if (!userId || !daysInput || !/^[0-9]+$/.test(userId) || !/^[0-9]+$/.test(daysInput)) {
    await sendCleanMessage(bot, chatId, '*⚠️ Format incorrect.* Use: `userId days`', {
      parse_mode: 'Markdown'
    });
    return true;
  }

  const days = Number(daysInput);
  if (days <= 0) {
    await sendCleanMessage(bot, chatId, '*⚠️ Duration must be at least 1 day.*', {
      parse_mode: 'Markdown'
    });
    return true;
  }

  const users = listUsers();
  const existing = users[userId];
  const baseTime = existing?.expiresAt && Number(existing.expiresAt) > Date.now()
    ? Number(existing.expiresAt)
    : Date.now();
  const newExpiry = baseTime + days * 24 * 60 * 60 * 1000;
  upsertUser(userId, newExpiry);
  ownerStates.delete(chatId);

  const message = `*✅ Access Updated*\n\nUser: \`${escapeMarkdown(userId)}\`\nExpires: _${escapeMarkdown(formatDuration(newExpiry))}_`;
  await sendCleanMessage(bot, chatId, message, buildMenu());
  return true;
};

module.exports = {
  handleOwnerCallback,
  handleOwnerInput,
  handleOwnerMenu
};
