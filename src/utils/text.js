const escapeMarkdown = (text = '') => text.replace(/[_*\[\]()~`>#+\-=|{}.!]/g, '\\$&');

const formatDuration = (expiresAt) => {
  if (!expiresAt) {
    return 'No expiry';
  }
  const date = new Date(Number(expiresAt));
  return date.toLocaleString('en-GB', { timeZone: 'UTC' }) + ' UTC';
};

module.exports = {
  escapeMarkdown,
  formatDuration
};
