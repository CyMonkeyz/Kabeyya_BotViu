const escapeMarkdown = (text = '') => text.replace(/[_*\[\]()~`>#+\-=|{}.!]/g, '\\$&');

const formatDuration = (expiresAt) => {
  if (!expiresAt) {
    return 'Tidak ada kedaluwarsa';
  }
  const date = new Date(Number(expiresAt));
  return date.toLocaleString('id-ID', { timeZone: 'UTC' }) + ' UTC';
};

module.exports = {
  escapeMarkdown,
  formatDuration
};
