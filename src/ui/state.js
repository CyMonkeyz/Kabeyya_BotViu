const stateStore = new Map();

const ensureStack = (chatId) => {
  if (!stateStore.has(chatId)) {
    stateStore.set(chatId, [{ id: 'home', payload: null }]);
  }
  return stateStore.get(chatId);
};

const pushState = (chatId, stateId, payload = null) => {
  const stack = ensureStack(chatId);
  const current = stack[stack.length - 1];
  if (!current || current.id !== stateId) {
    stack.push({ id: stateId, payload });
  } else {
    current.payload = payload;
  }
  return stack;
};

const replaceState = (chatId, stateId, payload = null) => {
  const stack = ensureStack(chatId);
  stack[stack.length - 1] = { id: stateId, payload };
  return stack;
};

const popState = (chatId) => {
  const stack = ensureStack(chatId);
  if (stack.length > 1) {
    stack.pop();
  }
  return stack[stack.length - 1];
};

const resetState = (chatId) => {
  stateStore.set(chatId, [{ id: 'home', payload: null }]);
  return stateStore.get(chatId)[0];
};

const getCurrentState = (chatId) => {
  const stack = ensureStack(chatId);
  return stack[stack.length - 1];
};

const getPreviousStateId = (chatId) => {
  const stack = ensureStack(chatId);
  if (stack.length > 1) {
    return stack[stack.length - 2].id;
  }
  return 'home';
};

module.exports = {
  getCurrentState,
  getPreviousStateId,
  popState,
  pushState,
  replaceState,
  resetState
};
