const { uuid } = require('uuidv4');

const getRandomBytes = (length) => {
  const characters = '0123456789abcdef';
  let bytesStr = '';
  for (let i = 0; i < length; i += 1) {
    bytesStr += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return bytesStr;
};

const getDeviceInfo = () => new Promise((resolve) => {
  const index = fetch(`https://um.viuapi.io/user/device?id1=${getRandomBytes(16)}`, {
    method: 'GET',
    headers: {
      'x-client-auth': 'b6fea2dd3d110b12fbd23d7ab8cd0ba3',
      accept: 'application/json',
      'x-client': 'android',
      'content-type': 'application/json',
      'x-session-id': getRandomBytes(32),
      'x-request-id': uuid(),
      'x-enable-drm': 'true',
      'user-agent': 'okhttp/4.9.3'
    }
  }).then(async (res) => {
    const data = await res.json();
    resolve({ data });
  });
  return index;
});

const getToken2 = (deviceId) => new Promise((resolve) => {
  const bodys = { deviceId };
  const index = fetch('https://um.viuapi.io/user/identity', {
    method: 'POST',
    headers: {
      'x-client-auth': 'b6fea2dd3d110b12fbd23d7ab8cd0ba3',
      accept: 'application/json',
      'x-client': 'android',
      'content-type': 'application/json',
      'x-session-id': getRandomBytes(32),
      'x-request-id': uuid(),
      'x-enable-drm': 'true',
      'user-agent': 'okhttp/4.9.3'
    },
    body: JSON.stringify(bodys)
  }).then(async (res) => {
    const data = await res.json();
    resolve({ data });
  });
  return index;
});

const getIdent = (deviceId, partner, tokenPartner) => new Promise((resolve) => {
  const bodys = {
    deviceId,
    partnerId: partner,
    partnerName: 'Telkomsel'
  };
  const index = fetch('https://um.viuapi.io/user/identity', {
    method: 'POST',
    headers: {
      'x-client-auth': 'b6fea2dd3d110b12fbd23d7ab8cd0ba3',
      accept: 'application/json',
      'x-client': 'android',
      'content-type': 'application/json',
      'x-session-id': getRandomBytes(16),
      'x-request-id': uuid(),
      'x-enable-drm': 'true',
      authorization: tokenPartner,
      'user-agent': 'okhttp/4.9.3'
    },
    body: JSON.stringify(bodys)
  }).then(async (res) => {
    const data = await res.json();
    resolve({ data });
  });
  return index;
});

const getAcc = (email, passhash, tokenPartner) => new Promise((resolve) => {
  const bodys = {
    password: passhash,
    principal: email,
    providerCode: 'email'
  };
  const index = fetch('https://um.viuapi.io/user/account', {
    method: 'POST',
    headers: {
      'x-client-auth': 'b6fea2dd3d110b12fbd23d7ab8cd0ba3',
      accept: 'application/json',
      'x-client': 'android',
      'content-type': 'application/json',
      'x-session-id': getRandomBytes(32),
      'x-request-id': uuid(),
      'x-enable-drm': 'true',
      authorization: tokenPartner,
      'user-agent': 'okhttp/4.9.3'
    },
    body: JSON.stringify(bodys)
  }).then(async (res) => {
    const data = await res.json();
    resolve({ data });
  });
  return index;
});

const getUserId = (accountId, deviceId, partner, tokenPartner) => new Promise((resolve) => {
  const bodys = {
    accountId,
    deviceId,
    partnerId: partner,
    partnerName: 'Telkomsel'
  };
  const index = fetch('https://um.viuapi.io/user/identity', {
    method: 'POST',
    headers: {
      'x-client-auth': 'b6fea2dd3d110b12fbd23d7ab8cd0ba3',
      accept: 'application/json',
      'x-client': 'android',
      'content-type': 'application/json',
      'x-session-id': getRandomBytes(32),
      'x-request-id': uuid(),
      'x-enable-drm': 'true',
      authorization: tokenPartner,
      'user-agent': 'okhttp/4.9.3'
    },
    body: JSON.stringify(bodys)
  }).then(async (res) => {
    const data = await res.json();
    resolve({ data });
  });
  return index;
});

const getInfo = (datauserid, datatoken, partner) => new Promise((resolve) => {
  const index = fetch(
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
        'x-request-id': uuid(),
        'x-enable-drm': 'true',
        'user-agent': 'okhttp/4.9.3'
      }
    }
  ).then(async (res) => {
    const data = await res.json();
    resolve({ data });
  });
  return index;
});

module.exports = {
  getAcc,
  getDeviceInfo,
  getIdent,
  getInfo,
  getRandomBytes,
  getToken2,
  getUserId
};
