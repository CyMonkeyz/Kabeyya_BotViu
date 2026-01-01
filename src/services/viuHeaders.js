const crypto = require('crypto');
const { v4: uuid } = require('uuid');

const { viuConfig } = require('../settings');

const hasHeader = (headers, name) => {
  if (!headers) return false;
  return Object.keys(headers).some((key) => key.toLowerCase() === name.toLowerCase());
};

const buildViuHeaders = (extraHeaders = {}, options = {}) => {
  const method = (options.method || 'GET').toUpperCase();
  const sanitizedExtra = { ...extraHeaders };
  if (!viuConfig.clientAuth) {
    Object.keys(sanitizedExtra).forEach((key) => {
      if (key.toLowerCase() === 'x-client-auth') {
        delete sanitizedExtra[key];
      }
    });
  }
  const baseHeaders = {
    accept: 'application/json',
    'x-client': viuConfig.client,
    'x-session-id': crypto.randomBytes(16).toString('hex'),
    'x-request-id': uuid(),
    'x-enable-drm': 'true',
    'user-agent': viuConfig.userAgent
  };

  if (viuConfig.clientAuth) {
    baseHeaders['x-client-auth'] = viuConfig.clientAuth;
  }

  if (['POST', 'PUT', 'PATCH'].includes(method) && !hasHeader(extraHeaders, 'content-type')) {
    baseHeaders['content-type'] = 'application/json';
  }

  return {
    ...sanitizedExtra,
    ...baseHeaders
  };
};

module.exports = {
  buildViuHeaders
};
