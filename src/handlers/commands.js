const fs = require('fs');
const crypto = require('crypto');
const randomName = require('node-random-name');

const { safeDelete } = require('../services/messages');
const { escapeMarkdown } = require('../utils/text');
const { rentalContact, rentalPrices, botName } = require('../settings');
const { checkClaimCooldown } = require('../services/antiSpam');
const { editMessageWithNav, sendDocumentWithNav, sendErrorWithNav, sendMessageWithNav } = require('../ui/messages');
const { resetState } = require('../ui/state');
const {
  getAcc,
  getDeviceInfo,
  getIdent,
  getInfo,
  getRandomBytes,
  getToken2,
  getUserId
} = require('../services/viuClient');

const buildRentalMessage = () => {
  const priceLines = rentalPrices
    .map((item) => `• *${escapeMarkdown(item.label)}* — _${escapeMarkdown(item.price)}_`)
    .join('\n');
  return (
    '*🔒 Akses Diperlukan*\n\n'
    + 'Terima kasih telah tertarik menggunakan *KabeyyaB2BViu*. Bot ini saat ini tersedia melalui sistem sewa.\n\n'
    + '*💼 Paket Sewa*\n'
    + `${priceLines}\n\n`
    + `*📩 Pesan di:* ${escapeMarkdown(rentalContact)}`
  );
};

const startMessage = () => (
  `*🌟 Selamat datang di ${escapeMarkdown(botName)}!*\n\n`
  + 'Asisten ini membantu membuat akun Viu dengan cepat dan stabil.\n\n'
  + '*🧭 Cara penggunaan*\n'
  + 'Kirim perintah dengan format berikut:\n'
  + '`/claim domain.com password partnerId total`\n'
  + 'Contoh: `/claim example.com Pass123 628451239123 10`\n\n'
  + '_Tips: pastikan input sudah benar agar proses lancar._'
);

const claimUsageMessage = () => (
  '*⚠️ Format perintah salah*\n\n'
  + 'Gunakan format:\n'
  + '`/claim domain.com password partnerId total`\n'
  + 'Contoh: `/claim example.com Pass123 628451239123 10`'
);

const handleStart = async (bot, chatId) => {
  resetState(chatId);
  await sendMessageWithNav(
    bot,
    chatId,
    startMessage(),
    { parse_mode: 'Markdown' },
    { stateId: 'home', replace: true }
  );
};

const handleUnauthorized = async (bot, chatId) => {
  resetState(chatId);
  await sendMessageWithNav(
    bot,
    chatId,
    buildRentalMessage(),
    { parse_mode: 'Markdown' },
    { stateId: 'home', replace: true }
  );
};

const handleClaim = async (bot, msg) => {
  const chatId = msg.chat.id;
  try {
    const text = msg.text || '';
    const parts = text.replace('/claim', '').trim().split(/\s+/).filter(Boolean);
    if (parts.length < 4) {
      await sendMessageWithNav(
        bot,
        chatId,
        claimUsageMessage(),
        { parse_mode: 'Markdown' },
        { stateId: 'claim', replace: true }
      );
      return;
    }
    const [domain, password, partner, countRaw] = parts;
    const count = Number.parseInt(countRaw, 10);
    if (!domain || !password || !partner || Number.isNaN(count) || count <= 0) {
      await sendMessageWithNav(
        bot,
        chatId,
        claimUsageMessage(),
        { parse_mode: 'Markdown' },
        { stateId: 'claim', replace: true }
      );
      return;
    }

    const rateLimit = checkClaimCooldown(msg.from.id);
    if (rateLimit.limited) {
      const seconds = Math.ceil(rateLimit.retryAfterMs / 1000);
      await sendMessageWithNav(
        bot,
        chatId,
        `*⏳ Mohon tunggu*\n\nAnda bisa membuat batch baru dalam *${seconds} detik*.`,
        { parse_mode: 'Markdown' },
        { stateId: 'claim', replace: true }
      );
      return;
    }

    const loadingMessage = await sendMessageWithNav(
      bot,
      chatId,
      '*⏳ Memproses pembuatan akun... 0%*',
      { parse_mode: 'Markdown' },
      { stateId: 'claim' }
    );

    const filename = `${count}_accounts_${getRandomBytes(2)}.txt`;
    let accountsData = '';

    for (let index = 0; index < count; index += 1) {
      const username = randomName().replace(/\s/g, '');
      const email = `${username}@${domain}`;

      const gettingDeviceId = await getDeviceInfo();
      const deviceId = gettingDeviceId.data.deviceId;

      if (!deviceId) {
        await editMessageWithNav(
          bot,
          chatId,
          loadingMessage.message_id,
          '*⚠️ Gagal membuat device ID.*',
          { parse_mode: 'Markdown' },
          { stateId: 'claim', replace: true }
        );
        return;
      }

      const gettingToken2 = await getToken2(deviceId);
      const tokenPartner = gettingToken2.data.token;

      const gettingPartner = await getIdent(deviceId, partner, tokenPartner);
      const tokenFromPartner = gettingPartner.data.token;

      if (!tokenFromPartner) {
        await editMessageWithNav(
          bot,
          chatId,
          loadingMessage.message_id,
          '*⚠️ Tidak bisa mengambil token partner.*',
          { parse_mode: 'Markdown' },
          { stateId: 'claim', replace: true }
        );
        return;
      }

      const passhash = crypto.createHash('md5').update(password).digest('hex');
      const gettingAccount = await getAcc(email, passhash, tokenFromPartner);
      const accountId = gettingAccount.data.accountId;
      if (!accountId) {
        await editMessageWithNav(
          bot,
          chatId,
          loadingMessage.message_id,
          '*⚠️ Gagal mendapatkan account ID.*',
          { parse_mode: 'Markdown' },
          { stateId: 'claim', replace: true }
        );
        return;
      }
      const gettingUserId = await getUserId(accountId, deviceId, partner, tokenFromPartner);
      const datauserid = gettingUserId.data.userId;
      const datatoken = gettingUserId.data.token;

      if (!datauserid || !datatoken) {
        await editMessageWithNav(
          bot,
          chatId,
          loadingMessage.message_id,
          '*⚠️ Gagal mendapatkan data akun dari penyedia.*',
          { parse_mode: 'Markdown' },
          { stateId: 'claim', replace: true }
        );
        return;
      }
      const info = await getInfo(datauserid, datatoken, partner);
      const days = info.data.MyAccount?.[0]?.userPLan?.Validity || 'Tidak diketahui';

      accountsData += `${email}:${password} | ${days} Hari Premium\n`;
      const progress = Math.floor(((index + 1) / count) * 100);
      await editMessageWithNav(
        bot,
        chatId,
        loadingMessage.message_id,
        `*⏳ Memproses pembuatan akun... ${progress}%*`,
        { parse_mode: 'Markdown' },
        { stateId: 'claim', replace: true }
      );
    }

    fs.writeFileSync(filename, accountsData);
    try {
      await sendDocumentWithNav(bot, chatId, filename, {
        caption: '*✅ Selesai!* File akun Anda sudah siap.',
        parse_mode: 'Markdown'
      }, { stateId: 'claim', replace: true });
      await safeDelete(bot, chatId, loadingMessage.message_id);
    } finally {
      fs.unlinkSync(filename);
    }
  } catch (error) {
    const message = error?.isServiceError
      ? `*⚠️ ${error.message}*`
      : '*⚠️ Terjadi kesalahan saat memproses permintaan.*\n\nSilakan coba lagi nanti.';
    await sendErrorWithNav(bot, chatId, message, 'claim');
  }
};

module.exports = {
  handleClaim,
  handleStart,
  handleUnauthorized
};
