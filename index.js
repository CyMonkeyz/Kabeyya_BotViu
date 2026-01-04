const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const token = "7252197175:AAHXAD2tcnWzprqyXcKzO8ptMasU0KzMY_8"
const bot = new TelegramBot(token, {
  polling: true
});
const figlet = require('figlet');
const colors = require('@colors/colors');
var random_name = require('node-random-name');
var HttpsProxyAgent = require('https-proxy-agent');
const crypto = require('crypto')
const randomUseragent = require('random-useragent');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const randstr = length => {
  var text = "";
  var possible =
    "abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz";
  for (var i = 0; i < length; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
};
const randnmr = length => {
  var text = "";
  var possible =
    "0123456789109876543210";
  for (var i = 0; i < length; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
};

function getRandomBytes(length) {
  const characters = '0123456789abcdef';
  let bytes_str = '';
  for (let i = 0; i < length; i++) {
    bytes_str += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return bytes_str;
}
async function fetchJsonOrThrow(url, options = {}) {
  const res = await fetch(url, options);

  const contentType = (res.headers.get('content-type') || '').toLowerCase();
  const raw = await res.text();

  if (!res.ok) {
    const snippet = raw.slice(0, 200).replace(/\s+/g, ' ');
    const err = new Error(`HTTP ${res.status} ${res.statusText} | ${snippet}`);
    err.status = res.status;
    throw err;
  }

  if (!contentType.includes('application/json')) {
    const snippet = raw.slice(0, 200).replace(/\s+/g, ' ');
    throw new Error(`Expected JSON but got ${contentType || '(no content-type)'} | ${snippet}`);
  }

  return JSON.parse(raw);
}
const getToken = (randomUserAgent) => new Promise((resolve, reject) => {
  const bodys = {
    'appVersion': '3.18.0',
    "countryCode": "ID",
    "language": "8",
    "platform": "browser",
    "platformFlagLabel": "web",
    "uuid": "61d194f7-3b31-4716-9d07-9584dbe26ba1",
    "carrierId": "333",
    "carrierName": "HUTCH"
  };
  const index = fetch('https://api-gateway-global.viu.com/api/auth/token?platform_flag_label=web&area_id=1000&language_flag_id=8&platformFlagLabel=web&areaId=1000&languageFlagId=8&countryCode=ID', {
      method: 'POST',
      headers: {
        'User-Agent': randomUserAgent,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bodys)
    })
    .then(async (res) => {
      const data = await res.json()
      resolve({
        data,
      })
    });
  return index
});
const getDeviceInfo = () => new Promise(async (resolve, reject) => {
  try {
    const data = await fetchJsonOrThrow(`https://um.viuapi.io/user/device?id1=${getRandomBytes(16)}`, {
      method: 'GET',
      headers: {
        "x-client-auth": "b6fea2dd3d110b12fbd23d7ab8cd0ba3",
        "accept": "application/json",
        "x-client": "android",
        "content-type": "application/json",
        "x-session-id": getRandomBytes(32),
        "x-request-id": uuidv4(),
        "x-enable-drm": "true",
        "user-agent": "okhttp/4.9.3",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Content-Type": "application/json",
        "Referer": "https://www.viu.com/",
        "Origin": "https://www.viu.com"
      },
    });
    resolve({
      data,
    });
  } catch (e) {
    reject(e);
  }
});
const getToken2 = (deviceId) => new Promise((resolve, reject) => {
  const bodys = {
    "deviceId": deviceId
  };
  const index = fetch(`https://um.viuapi.io/user/identity`, {
      method: 'POST',
      headers: {
        "x-client-auth": "b6fea2dd3d110b12fbd23d7ab8cd0ba3",
        "accept": "application/json",
        "x-client": "android",
        "content-type": "application/json",
        "x-session-id": getRandomBytes(32),
        "x-request-id": uuidv4(),
        "x-enable-drm": "true",
        "user-agent": "okhttp/4.9.3"
      },
      body: JSON.stringify(bodys)
    })
    .then(async (res) => {
      const data = await res.json()
      resolve({
        data,
      })
    });
  return index
});
const getIdent = (partner, deviceId, tokenPartner) => new Promise((resolve, reject) => {
  const bodys = {
    "deviceId": deviceId,
    "partnerId": partner,
    "partnerName": "Telkomsel"
  };
  const index = fetch(`https://um.viuapi.io/user/identity`, {
      method: 'POST',
      headers: {
        "x-client-auth": "b6fea2dd3d110b12fbd23d7ab8cd0ba3",
        "accept": "application/json",
        "x-client": "android",
        "content-type": "application/json",
        "x-session-id": getRandomBytes(16),
        "x-request-id": uuidv4(),
        "x-enable-drm": "true",
        "authorization": tokenPartner,
        "user-agent": "okhttp/4.9.3"
      },
      body: JSON.stringify(bodys)
    })
    .then(async (res) => {
      const data = await res.json()
      resolve({
        data,
      })
    });
  return index
});
const getAccount = (email, password, randomUserAgent, token) => new Promise((resolve, reject) => {
  const bodys = {
    'email': email,
    'password': password,
    'authPrivacy': 1,
    'provider': 'email'
  };
  const index = fetch('https://api-gateway-global.viu.com/api/auth/register', {
      method: 'POST',
      headers: {
        'User-Agent': randomUserAgent,
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(bodys)
    })
    .then(async (res) => {
      const data = await res.json()
      resolve({
        data,
      })
    });
  return index
});
const getAcc = (email, passhash, tokendaripartner) => new Promise((resolve, reject) => {
  const bodys = {
    "password": passhash,
    "principal": email,
    "providerCode": "email"
  };
  const index = fetch('https://um.viuapi.io/user/account', {
      method: 'POST',
      headers: {
        "x-client-auth": "b6fea2dd3d110b12fbd23d7ab8cd0ba3",
        "accept": "application/json",
        "x-client": "android",
        "content-type": "application/json",
        "x-session-id": getRandomBytes(32),
        "x-request-id": uuidv4(),
        "x-enable-drm": "true",
        "authorization": tokendaripartner,
        "user-agent": "okhttp/4.9.3"
      },
      body: JSON.stringify(bodys)
    })
    .then(async (res) => {
      const data = await res.json()
      resolve({
        data,
      })
    });
  return index
});
const getUserId = (accountId, deviceId, partner, tokendaripartner) => new Promise((resolve, reject) => {
  const bodys = {
    "accountId": accountId,
    "deviceId": deviceId,
    "partnerId": partner,
    "partnerName": "Telkomsel"
  };
  const index = fetch('https://um.viuapi.io/user/identity', {
      method: 'POST',
      headers: {
        "x-client-auth": "b6fea2dd3d110b12fbd23d7ab8cd0ba3",
        "accept": "application/json",
        "x-client": "android",
        "content-type": "application/json",
        "x-session-id": getRandomBytes(32),
        "x-request-id": uuidv4(),
        "x-enable-drm": "true",
        "authorization": tokendaripartner,
        "user-agent": "okhttp/4.9.3"
      },
      body: JSON.stringify(bodys)
    })
    .then(async (res) => {
      const data = await res.json()
      resolve({
        data,
      })
    });
  return index
});
const getInfo = (datauserid, datatoken, partner) => new Promise((resolve, reject) => {
  const index = fetch(`https://um.viuapi.io/viuapp-bff/v1/my?appid=viu_android&ver=2.0&appver=2.1.0&fmt=json&platform=app&productId=1&iid=${getRandomBytes(16)}=samsung&carrierid=72&model=SM-S918B&devicetimezone=&devicecountry=&languageid=id&geo=10&regionid=all&ccode=ID&appsessid=&offerid=tmsel.30.VIU_MAX30D2&msisdn=${partner}&vuserid=${datauserid}&partner=Telkomsel&userid=${datauserid}&contentFlavour=all&networkType=4g&deviceId=${getRandomBytes(16)}&configVersion=1.0&languageId=id&partnerName=Telkomsel`, {
      method: 'GET',
      headers: {
        "x-client-auth": "b6fea2dd3d110b12fbd23d7ab8cd0ba3",
        "authorization": datatoken,
        "accept": "application/json",
        "x-client": "android",
        "content-type": "application/json",
        "x-session-id": getRandomBytes(32),
        "x-request-id": uuidv4(),
        "x-enable-drm": "true",
        "user-agent": "okhttp/4.9.3"
      },
    })
    .then(async (res) => {
      const data = await res.json()
      resolve({
        data,
      })
    });
  return index
});
const start = () => {
  console.log(
    colors.white(
      figlet.textSync('Telegram BOT', {
        horizontalLayout: 'fitted'
      })
    )
  );
  (async () => {
    console.log('       By AMFCODE\n\n')
    console.log(colors.yellow(`Server Running!`))
    bot.onText(/\echo (.+)/, (msg, macth) => {
      const chatId = msg.chat.id;
      const resp = match[1];
      bot.sendMessage(chatId, resp);
    });
    bot.on('message', async msg => {
      let date_ob = new Date();
      let date = ("0" + date_ob.getDate()).slice(-2);
      let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
      let year = date_ob.getFullYear();
      let hours = date_ob.getHours();
      let minutes = date_ob.getMinutes();
      let seconds = date_ob.getSeconds();
      const text = msg.text;
      const chatId = msg.chat.id;
      const chatIdCheck = chatId
      const userName = msg.from.username;
      const usernnamenya = msg.from.username;
      const cmdnya = `[+] From : ${userName} | Chat ID : ${chatId} | Pesan : ${text}`;
      console.log(colors.yellow(`${cmdnya} | Jam : ${hours}:${minutes} | Tanggal : ${date}-${month}-${year}`));
      const command = '/claim';
if (text.startsWith(command)) {
    const datanya = text.replace('/claim', '').trim();
    const textdata = datanya.split(' ');
    const domain = textdata[0];
    const password = textdata[1];
    const partner = textdata[2];
    const berapa = parseInt(textdata[3]);
    
    const loadingMessage = await bot.sendMessage(chatId, '⏳ Processing Creating Account 0%');

    let namafile = `${berapa} Account by amfcode${getRandomBytes(2)}.txt`;
    let accountsData = '';

    for (let index = 0; index < berapa; index++) {
      const randomUserAgent = randomUseragent.getRandom();
      const username = random_name().replace(/\s/g, '');
      const email = `${username}@${domain}`;

      let gettingDeviceId;
      try {
        gettingDeviceId = await getDeviceInfo();
      } catch (e) {
        await bot.editMessageText(`Request gagal: ${e.message}`, { chat_id: chatId, message_id: loadingMessage.message_id });
        return;
      }
      const deviceId = gettingDeviceId.data.deviceId;

      if (deviceId) {
        const gettingToken2 = await getToken2(deviceId);
        const tokenPartner = gettingToken2.data.token;

        const gettingPartner = await getIdent(deviceId, partner, tokenPartner);
        const tokendaripartner = gettingPartner.data.token;

        if (tokendaripartner) {
          const passhash = crypto.createHash('md5').update(password).digest('hex');
          const gettingAccount = await getAcc(email, passhash, tokendaripartner);
          const accountId = gettingAccount.data.accountId;
          const gettingUserId = await getUserId(accountId, deviceId, partner, tokendaripartner);
          const datauserid = gettingUserId.data.userId;
          const datatoken = gettingUserId.data.token;
          const infonya = await getInfo(datauserid, datatoken, partner);
          const hari = infonya.data.MyAccount[0].userPLan.Validity;

          accountsData += `${email}:${password} | ${hari} Premium Days\n`;
          const progress = Math.floor(((index + 1) / berapa) * 100);
          await bot.editMessageText(`⏳ Processing Creating Account ${progress}%`, { chat_id: chatId, message_id: loadingMessage.message_id });
        } else {
          await bot.editMessageText('Error Getting Token Dari Partner', { chat_id: chatId, message_id: loadingMessage.message_id });
          break;
        }
      } else {
        await bot.editMessageText('Error Getting Device ID!', { chat_id: chatId, message_id: loadingMessage.message_id });
        break;
      }
    }

    fs.writeFileSync(`${namafile}`, accountsData);
    bot.sendDocument(chatId, `${namafile}`).then(() => {
      fs.unlinkSync(`${namafile}`);
      bot.deleteMessage(chatId, loadingMessage.message_id);
    }).catch((err) => {
      console.log(err);
      bot.sendMessage(chatId, 'Failed to send document!');
    });

} else if (text.startsWith('/start')) {
        bot.sendMessage(chatId, `🚀 Selamat Datang di AMFCODE Bot! 🚀\n\nIni Adalah Bot Auto Creator Account Viu Termasuk Premium Account\n\n :
Membuat Akun Tanpa Batas 🚀✨

/claim domain.com password noviu jumlahakun
contoh : /claim ariganteng.com maulana2004 628451239123 10`)
      }
    });
  })();
};
start();
