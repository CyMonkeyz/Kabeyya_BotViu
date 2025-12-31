const fs = require('fs');
const path = require('path');

const usersFile = path.join(__dirname, '..', 'storage', 'users.json');

const ensureStore = () => {
  if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, JSON.stringify({}, null, 2));
  }
};

const readUsers = () => {
  ensureStore();
  const raw = fs.readFileSync(usersFile, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (error) {
    return {};
  }
};

const writeUsers = (users) => {
  const tempFile = `${usersFile}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(users, null, 2));
  fs.renameSync(tempFile, usersFile);
};

const upsertUser = (userId, expiresAt) => {
  const users = readUsers();
  users[userId] = { expiresAt };
  writeUsers(users);
  return users[userId];
};

const removeUser = (userId) => {
  const users = readUsers();
  const existed = Boolean(users[userId]);
  delete users[userId];
  writeUsers(users);
  return existed;
};

const listUsers = () => readUsers();

module.exports = {
  listUsers,
  readUsers,
  removeUser,
  upsertUser
};
