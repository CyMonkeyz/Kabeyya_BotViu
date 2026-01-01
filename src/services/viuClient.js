const { v4: uuidv4 } = require('uuid');
const { fetchJsonSafe, HttpResponseError } = require('../utils/http');

const getRandomBytes = (length) => {
  const characters = '0123456789abcdef';
  let bytesStr = '';
  for (let i = 0; i < length; i += 1) {
    bytesStr += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return bytesStr;
};

const buildServiceError = (error, context) => {
  console.error(`[viuClient] ${context} - ${error.message}`);

  if (error instanceof HttpResponseError) {
    if (error.status === 403 || !error.isJson) {
      const wrapped = new Error(
        'Akses ditolak oleh penyedia (403) atau respons tidak valid. '
        + 'Silakan coba lagi nanti atau gunakan metode resmi yang tersedia.'
      );
      wrapped.isServiceError = true;
      wrapped.status = error.status;
      return wrapped;
    }
  }

  const wrapped = new Error(
    'Terjadi gangguan saat menghubungi layanan. Silakan coba lagi nanti.'
  );
  wrapped.isServiceError = true;
  return wrapped;
};

const requestJson = async (url, options, context) => {
  try {
    const data = await fetchJsonSafe(url, options, {
      timeoutMs: 15000,
      retries: 1,
      retryDelayMs: 600
    });
    return { data };
  } catch (error) {
    throw buildServiceError(error, context);
  }
};

const getDeviceInfo = async () => requestJson(
  `https://um.viuapi.io/user/device?id1=${getRandomBytes(16)}`,
  {
    method: 'GET',
    headers: {
      'x-client-auth': 'b6fea2dd3d110b12fbd23d7ab8cd0ba3',
      accept: 'application/json',
      'x-client': 'android',
      'content-type': 'application/json',
      'x-session-id': getRandomBytes(32),
      'x-request-id': uuidv4(),
      'x-enable-drm': 'true',
      'user-agent': 'okhttp/4.9.3'
    }
  },
  'getDeviceInfo'
);

const getToken2 = async (deviceId) => requestJson(
  'https://um.viuapi.io/user/identity',
  {
    method: 'POST',
    headers: {
      'x-client-auth': 'b6fea2dd3d110b12fbd23d7ab8cd0ba3',
      accept: 'application/json',
      'x-client': 'android',
      'content-type': 'application/json',
      'x-session-id': getRandomBytes(32),
      'x-request-id': uuidv4(),
      'x-enable-drm': 'true',
      'user-agent': 'okhttp/4.9.3'
    },
    body: JSON.stringify({ deviceId })
  },
  'getToken2'
);

const getIdent = async (deviceId, partner, tokenPartner) => requestJson(
  'https://um.viuapi.io/user/identity',
  {
    method: 'POST',
    headers: {
      'x-client-auth': 'b6fea2dd3d110b12fbd23d7ab8cd0ba3',
      accept: 'application/json',
      'x-client': 'android',
      'content-type': 'application/json',
      'x-session-id': getRandomBytes(16),
      'x-request-id': uuidv4(),
      'x-enable-drm': 'true',
      authorization: tokenPartner,
      'user-agent': 'okhttp/4.9.3'
    },
    body: JSON.stringify({
      deviceId,
      partnerId: partner,
      partnerName: 'Telkomsel'
    })
  },
  'getIdent'
);

const getAcc = async (email, passhash, tokenPartner) => requestJson(
  'https://um.viuapi.io/user/account',
  {
    method: 'POST',
    headers: {
      'x-client-auth': 'b6fea2dd3d110b12fbd23d7ab8cd0ba3',
      accept: 'application/json',
      'x-client': 'android',
      'content-type': 'application/json',
      'x-session-id': getRandomBytes(32),
      'x-request-id': uuidv4(),
      'x-enable-drm': 'true',
      authorization: tokenPartner,
      'user-agent': 'okhttp/4.9.3'
    },
    body: JSON.stringify({
      password: passhash,
      principal: email,
      providerCode: 'email'
    })
  },
  'getAcc'
);

const getUserId = async (accountId, deviceId, partner, tokenPartner) => requestJson(
  'https://um.viuapi.io/user/identity',
  {
    method: 'POST',
    headers: {
      'x-client-auth': 'b6fea2dd3d110b12fbd23d7ab8cd0ba3',
      accept: 'application/json',
      'x-client': 'android',
      'content-type': 'application/json',
      'x-session-id': getRandomBytes(32),
      'x-request-id': uuidv4(),
      'x-enable-drm': 'true',
      authorization: tokenPartner,
      'user-agent': 'okhttp/4.9.3'
    },
    body: JSON.stringify({
      accountId,
      deviceId,
      partnerId: partner,
      partnerName: 'Telkomsel'
    })
  },
  'getUserId'
);

const getInfo = async (datauserid, datatoken, partner) => requestJson(
  `https://um.viuapi.io/viuapp-bff/v1/my?appid=viu_android&ver=2.0&appver=2.1.0&fmt=json&platform=app&productId=1&iid=${getRandomBytes(16)}=samsung&carrierid=72&model=SM-S918B&devicetimezone=&devicecountry=&languageid=id&geo=10&regionid=all&ccode=ID&appsessid=&offerid=tmsel.30.VIU_MAX30D2&msisdn=${partner}&vuserid=${datauserid}&partner=Telkomsel&userid=${datauserid}&contentFlavour=all&networkType=4g&deviceId=${getRandomBytes(16)}&configVersion=1.0&languageId=id&partnerName=Telkomsel`,
  {
    method: 'GET',
    headers: {
      'x-client-auth': 'b6fea2dd3d110b12fbd23d7ab8cd0ba3',
      authorization: datatoken,
      accept: 'application/json',
      'x-client': 'android',
      'content-type': 'application/json',
      'x-session-id': getRandomBytes(32),
      'x-request-id': uuidv4(),
      'x-enable-drm': 'true',
      'user-agent': 'okhttp/4.9.3'
    }
  },
  'getInfo'
);

module.exports = {
  getAcc,
  getDeviceInfo,
  getIdent,
  getInfo,
  getRandomBytes,
  getToken2,
  getUserId
};
