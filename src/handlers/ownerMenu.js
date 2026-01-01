const { escapeMarkdown, formatDuration } = require('../utils/text');
const { listUsers, removeUser, upsertUser } = require('../services/userStore');
const { isOwner } = require('../settings');
const { sendMessageWithNav } = require('../ui/messages');
const { getCurrentState, resetState } = require('../ui/state');

const ownerStates = new Map();

const buildMenuButtons = () => ([
  [
    { text: '➕ Tambah User', callback_data: 'owner_add' },
    { text: '⏱️ Perpanjang User', callback_data: 'owner_extend' }
  ],
  [
    { text: '➖ Hapus User', callback_data: 'owner_remove' },
    { text: '📋 Daftar User', callback_data: 'owner_list' }
  ],
  [{ text: '✅ Tutup', callback_data: 'owner_close' }]
]);

const menuText = '*🛡️ Panel Owner*\n\nPilih aksi di bawah untuk mengelola akses.';

const handleOwnerMenu = async (bot, chatId) => {
  await sendMessageWithNav(
    bot,
    chatId,
    menuText,
    { parse_mode: 'Markdown' },
    { stateId: 'owner_menu', extraButtons: buildMenuButtons() }
  );
};

const renderOwnerPrompt = async (bot, chatId, mode) => {
  const prompts = {
    add: '*➕ Tambah Akses*\n\nKirim user ID dan durasi (hari).\nContoh: `123456789 30`',
    extend: '*⏱️ Perpanjang Akses*\n\nKirim user ID dan tambahan hari.\nContoh: `123456789 7`',
    remove: '*➖ Hapus Akses*\n\nKirim user ID yang akan dihapus.\nContoh: `123456789`'
  };

  const stateId = mode === 'extend'
    ? 'owner_extend'
    : mode === 'remove'
      ? 'owner_remove'
      : 'owner_add';

  await sendMessageWithNav(
    bot,
    chatId,
    prompts[mode],
    { parse_mode: 'Markdown' },
    { stateId, extraButtons: buildMenuButtons() }
  );
};

const clearOwnerState = (chatId) => {
  ownerStates.delete(chatId);
};

const handleOwnerCallback = async (bot, query) => {
  const chatId = query.message.chat.id;
  if (!isOwner(query.from.id)) {
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

  if (query.data === 'owner_list') {
    const users = listUsers();
    const lines = Object.entries(users).map(([userId, data]) => {
      const expiresAt = formatDuration(data.expiresAt);
      return `• \`${escapeMarkdown(userId)}\` — _${escapeMarkdown(expiresAt)}_`;
    });
    const body = lines.length ? lines.join('\n') : '_Belum ada user terdaftar._';
    await sendMessageWithNav(
      bot,
      chatId,
      `*📋 Daftar User*\n\n${body}`,
      { parse_mode: 'Markdown' },
      { stateId: 'owner_menu', extraButtons: buildMenuButtons(), replace: true }
    );
    return;
  }

  if (query.data === 'owner_close') {
    ownerStates.delete(chatId);
    resetState(chatId);
    await sendMessageWithNav(
      bot,
      chatId,
      '*✅ Panel ditutup.*',
      { parse_mode: 'Markdown' },
      { stateId: 'home', replace: true }
    );
    return;
  }

  if (query.data === 'owner_add') {
    ownerStates.set(chatId, { mode: 'add' });
    await renderOwnerPrompt(bot, chatId, 'add');
    return;
  }

  if (query.data === 'owner_extend') {
    ownerStates.set(chatId, { mode: 'extend' });
    await renderOwnerPrompt(bot, chatId, 'extend');
    return;
  }

  if (query.data === 'owner_remove') {
    ownerStates.set(chatId, { mode: 'remove' });
    await renderOwnerPrompt(bot, chatId, 'remove');
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
      await sendMessageWithNav(
        bot,
        chatId,
        '*⚠️ Mohon kirim user ID berupa angka.*',
        { parse_mode: 'Markdown' },
        { stateId: 'owner_remove', extraButtons: buildMenuButtons(), replace: true }
      );
      return true;
    }
    const removed = removeUser(userId);
    const message = removed
      ? `*✅ Berhasil menghapus* user \`${escapeMarkdown(userId)}\`.`
      : `*ℹ️ User* \`${escapeMarkdown(userId)}\` *tidak ditemukan.*`;
    ownerStates.delete(chatId);
    await sendMessageWithNav(
      bot,
      chatId,
      message,
      { parse_mode: 'Markdown' },
      { stateId: 'owner_menu', extraButtons: buildMenuButtons(), replace: true }
    );
    return true;
  }

  const [userId, daysInput] = text.split(/\s+/);
  if (!userId || !daysInput || !/^[0-9]+$/.test(userId) || !/^[0-9]+$/.test(daysInput)) {
    const stateId = state.mode === 'extend' ? 'owner_extend' : 'owner_add';
    await sendMessageWithNav(
      bot,
      chatId,
      '*⚠️ Format salah.* Gunakan: `userId hari`',
      { parse_mode: 'Markdown' },
      { stateId, extraButtons: buildMenuButtons(), replace: true }
    );
    return true;
  }

  const days = Number(daysInput);
  if (days <= 0) {
    const stateId = state.mode === 'extend' ? 'owner_extend' : 'owner_add';
    await sendMessageWithNav(
      bot,
      chatId,
      '*⚠️ Durasi minimal 1 hari.*',
      { parse_mode: 'Markdown' },
      { stateId, extraButtons: buildMenuButtons(), replace: true }
    );
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

  const message = `*✅ Akses Diperbarui*\n\nUser: \`${escapeMarkdown(userId)}\`\nBerakhir: _${escapeMarkdown(formatDuration(newExpiry))}_`;
  await sendMessageWithNav(
    bot,
    chatId,
    message,
    { parse_mode: 'Markdown' },
    { stateId: 'owner_menu', extraButtons: buildMenuButtons(), replace: true }
  );
  return true;
};

module.exports = {
  clearOwnerState,
  handleOwnerCallback,
  handleOwnerInput,
  handleOwnerMenu,
  renderOwnerPrompt
};
