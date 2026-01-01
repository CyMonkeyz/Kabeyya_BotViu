'use strict';

// ===== Helpers =====
function readEnv(name, fallback = '') {
  const raw = process.env[name];
  if (typeof raw !== 'string') return fallback;
  const trimmed = raw.trim();
  return trimmed.length ? trimmed : fallback;
}

function readInt(name, fallback = 0) {
  const raw = readEnv(name, '');
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

/** Parse "111,222,333" jadi array string ["111","222","333"] */
function parseIdList(value) {
  return String(value || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => String(Number(x))) // normalisasi numeric
    .filter((x) => x !== 'NaN');
}

// ===== Wajib diisi =====
const token = readEnv('TOKEN_BOT') || readEnv('BOT_TOKEN'); // pilih salah satu ENV
if (!token) {
  throw new Error(
    'TOKEN_BOT/BOT_TOKEN belum di-set. Set ENV dulu. Contoh: $env:TOKEN_BOT="123:ABC"'
  );
}

// ===== Owner / Admin =====
// Cara terbaik: set OWNER_ID di ENV (comma-separated)
// Kalau tidak pakai ENV, ubah default di bawah ini.
const DEFAULT_OWNER_IDS = '0'; // <-- ganti jadi ID kamu, atau tetap pakai ENV OWNER_ID
const ownerIds = parseIdList(readEnv('OWNER_ID', DEFAULT_OWNER_IDS));
const ownerSet = new Set(ownerIds);
function isOwner(userId) {
  return ownerSet.has(String(userId));
}

// ===== Role tambahan (opsional) =====
// "accessId" dianggap role khusus (lihat src/services/accessControl.js)
const accessId = readInt('ACCESS_ID', 0);

// ===== Informasi bot & pricing =====
const botName = readEnv('BOT_NAME', 'KabeyyaB2BViu'); // nama bot untuk tampilan
const rentalContact = readEnv('RENTAL_CONTACT', 't.me/Taubatz');

// Untuk simpel, harga tetap di-hardcode (boleh kamu ubah)
const rentalPrices = [
  { label: '1 Hari', price: '$1' },
  { label: '7 Hari', price: '$5' },
  { label: '30 Hari', price: '$15' }
];

// ===== Rate limit / anti spam =====
const rateLimit = {
  windowMs: readInt('RATE_WINDOW_MS', 8000),
  maxMessages: readInt('RATE_MAX_MESSAGES', 4),
  claimCooldownMs: readInt('RATE_CLAIM_COOLDOWN_MS', 30000)
};

module.exports = {
  // wajib
  token,

  // owner
  ownerIds,
  ownerSet,
  isOwner,

  // roles
  accessId,

  // info
  botName,
  rentalContact,
  rentalPrices,

  // anti spam
  rateLimit
};
