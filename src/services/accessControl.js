const { ownerId, accessId } = require('../settings');
const { listUsers } = require('./userStore');

const getRole = (userId) => {
  if (userId === ownerId) {
    return 'owner';
  }
  if (userId === accessId) {
    return 'access';
  }
  return 'user';
};

const isAuthorized = (userId) => {
  if (userId === ownerId || userId === accessId) {
    return { allowed: true, expiresAt: null, role: getRole(userId) };
  }
  const users = listUsers();
  const record = users[userId];
  if (!record) {
    return { allowed: false, expiresAt: null, role: getRole(userId) };
  }
  const { expiresAt } = record;
  if (!expiresAt) {
    return { allowed: true, expiresAt: null, role: getRole(userId) };
  }
  if (Date.now() <= Number(expiresAt)) {
    return { allowed: true, expiresAt: Number(expiresAt), role: getRole(userId) };
  }
  return { allowed: false, expiresAt: Number(expiresAt), role: getRole(userId) };
};

module.exports = {
  getRole,
  isAuthorized
};
