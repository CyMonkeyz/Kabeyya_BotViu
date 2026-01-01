const parseIdList = (value) => String(value || '')
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean);

// Set OWNER_ID env (comma-separated) or update the default below.
const defaultOwnerIds = '0';
const ownerIds = parseIdList(process.env.OWNER_ID || defaultOwnerIds);
const ownerSet = new Set(ownerIds);
const isOwner = (userId) => ownerSet.has(String(userId));

module.exports = {
  token: "8559527210:AAGaxTg1YJBZUOSJfOOql8zPDX-np3dRmVU",
  // Gunakan OWNER_ID env atau ubah defaultOwnerIds untuk banyak owner.
  ownerIds,
  ownerSet,
  isOwner,
  accessId: 0,
  botName: "KabeyyaB2BViu",
  rentalContact: "t.me/Taubatz",
  rentalPrices: [
    { label: "1 Hari", price: "$1" },
    { label: "7 Hari", price: "$5" },
    { label: "30 Hari", price: "$15" }
  ],
  rateLimit: {
    windowMs: 8000,
    maxMessages: 4,
    claimCooldownMs: 30000
  }
};
