const fs = require('fs');
const crypto = require('crypto');
const randomName = require('node-random-name');

const { sendCleanMessage, editMessage, sendCleanDocument, safeDelete } = require('../services/messages');
const { escapeMarkdown } = require('../utils/text');
const { rentalContact, rentalPrices, botName } = require('../settings');
const { checkClaimCooldown } = require('../services/antiSpam');
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
    '*🔒 Access Required*\n\n'
    + 'Thank you for your interest in *KabeyyaB2BViu*. This bot is currently available by rental only.\n\n'
    + '*💼 Rental Packages*\n'
    + `${priceLines}\n\n`
    + `*📩 Order here:* ${escapeMarkdown(rentalContact)}`
  );
};

const startMessage = () => (
  `*🌟 Welcome to ${escapeMarkdown(botName)}!*\n\n`
  + 'This assistant helps you generate Viu accounts quickly and reliably.\n\n'
  + '*🧭 How to use*\n'
  + 'Send a command in the format below:\n'
  + '`/claim domain.com password partnerId total`\n'
  + 'Example: `/claim example.com Pass123 628451239123 10`\n\n'
  + '_Tip: keep your input accurate to avoid delays._'
);

const claimUsageMessage = () => (
  '*⚠️ Invalid command format*\n\n'
  + 'Please use:\n'
  + '`/claim domain.com password partnerId total`\n'
  + 'Example: `/claim example.com Pass123 628451239123 10`'
);

const handleStart = async (bot, chatId) => {
  await sendCleanMessage(bot, chatId, startMessage(), { parse_mode: 'Markdown' });
};

const handleUnauthorized = async (bot, chatId) => {
  await sendCleanMessage(bot, chatId, buildRentalMessage(), { parse_mode: 'Markdown' });
};

const handleClaim = async (bot, msg) => {
  const chatId = msg.chat.id;
  const text = msg.text || '';
  const parts = text.replace('/claim', '').trim().split(/\s+/).filter(Boolean);
  if (parts.length < 4) {
    await sendCleanMessage(bot, chatId, claimUsageMessage(), { parse_mode: 'Markdown' });
    return;
  }
  const [domain, password, partner, countRaw] = parts;
  const count = Number.parseInt(countRaw, 10);
  if (!domain || !password || !partner || Number.isNaN(count) || count <= 0) {
    await sendCleanMessage(bot, chatId, claimUsageMessage(), { parse_mode: 'Markdown' });
    return;
  }

  const rateLimit = checkClaimCooldown(msg.from.id);
  if (rateLimit.limited) {
    const seconds = Math.ceil(rateLimit.retryAfterMs / 1000);
    await sendCleanMessage(
      bot,
      chatId,
      `*⏳ Please wait*\n\nYou can create another batch in *${seconds} seconds*.`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  const loadingMessage = await sendCleanMessage(
    bot,
    chatId,
    '*⏳ Processing account creation... 0%*',
    { parse_mode: 'Markdown' }
  );

  const filename = `${count}_accounts_${getRandomBytes(2)}.txt`;
  let accountsData = '';

  for (let index = 0; index < count; index += 1) {
    const username = randomName().replace(/\s/g, '');
    const email = `${username}@${domain}`;

    const gettingDeviceId = await getDeviceInfo();
    const deviceId = gettingDeviceId.data.deviceId;

    if (!deviceId) {
      await editMessage(bot, chatId, loadingMessage.message_id, '*⚠️ Failed to generate device ID.*', {
        parse_mode: 'Markdown'
      });
      return;
    }

    const gettingToken2 = await getToken2(deviceId);
    const tokenPartner = gettingToken2.data.token;

    const gettingPartner = await getIdent(deviceId, partner, tokenPartner);
    const tokenFromPartner = gettingPartner.data.token;

    if (!tokenFromPartner) {
      await editMessage(bot, chatId, loadingMessage.message_id, '*⚠️ Unable to fetch partner token.*', {
        parse_mode: 'Markdown'
      });
      return;
    }

    const passhash = crypto.createHash('md5').update(password).digest('hex');
    const gettingAccount = await getAcc(email, passhash, tokenFromPartner);
    const accountId = gettingAccount.data.accountId;
    const gettingUserId = await getUserId(accountId, deviceId, partner, tokenFromPartner);
    const datauserid = gettingUserId.data.userId;
    const datatoken = gettingUserId.data.token;
    const info = await getInfo(datauserid, datatoken, partner);
    const days = info.data.MyAccount?.[0]?.userPLan?.Validity || 'Unknown';

    accountsData += `${email}:${password} | ${days} Premium Days\n`;
    const progress = Math.floor(((index + 1) / count) * 100);
    await editMessage(
      bot,
      chatId,
      loadingMessage.message_id,
      `*⏳ Processing account creation... ${progress}%*`,
      { parse_mode: 'Markdown' }
    );
  }

  fs.writeFileSync(filename, accountsData);
  try {
    await sendCleanDocument(bot, chatId, filename, {
      caption: '*✅ Completed!* Your accounts file is ready.',
      parse_mode: 'Markdown'
    });
    await safeDelete(bot, chatId, loadingMessage.message_id);
  } finally {
    fs.unlinkSync(filename);
  }
};

module.exports = {
  handleClaim,
  handleStart,
  handleUnauthorized
};
