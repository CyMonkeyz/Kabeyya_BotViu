const buildNavKeyboard = ({ backTo = 'home', extraButtons = [] } = {}) => ({
  reply_markup: {
    inline_keyboard: [
      ...extraButtons,
      [
        { text: '⬅️ Kembali', callback_data: `nav:back:${backTo}` },
        { text: '❌ Batalkan', callback_data: 'nav:cancel' }
      ]
    ]
  }
});

module.exports = {
  buildNavKeyboard
};
