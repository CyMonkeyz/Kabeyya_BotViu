const { rateLimit } = require('../settings');

const userWindows = new Map();
const claimCooldown = new Map();

const pruneWindow = (timestamps, now) => timestamps.filter((time) => now - time <= rateLimit.windowMs);

const checkRateLimit = (userId) => {
  const now = Date.now();
  const timestamps = userWindows.get(userId) || [];
  const pruned = pruneWindow(timestamps, now);
  pruned.push(now);
  userWindows.set(userId, pruned);

  if (pruned.length > rateLimit.maxMessages) {
    return { limited: true, reason: 'message' };
  }
  return { limited: false };
};

const checkClaimCooldown = (userId) => {
  const now = Date.now();
  const last = claimCooldown.get(userId) || 0;
  if (now - last < rateLimit.claimCooldownMs) {
    return { limited: true, retryAfterMs: rateLimit.claimCooldownMs - (now - last) };
  }
  claimCooldown.set(userId, now);
  return { limited: false };
};

const setClaimCooldown = (userId, cooldownMs = rateLimit.claimCooldownMs) => {
  const now = Date.now();
  claimCooldown.set(userId, now - rateLimit.claimCooldownMs + cooldownMs);
};

module.exports = {
  checkRateLimit,
  checkClaimCooldown,
  setClaimCooldown
};
