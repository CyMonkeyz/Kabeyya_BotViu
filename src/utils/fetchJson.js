const { fetchJsonSafe, HttpResponseError } = require('./http');
const { viuConfig } = require('../settings');
const { buildViuHeaders } = require('../services/viuHeaders');

class ServiceError extends Error {
  constructor(message, meta = {}) {
    super(message);
    this.name = 'ServiceError';
    this.meta = meta;
    this.isServiceError = true;
  }
}

const DEFAULT_UM_BASE_URL = 'https://um.viuapi.io';

const normalizeUmUrl = (url) => {
  if (!url.startsWith(DEFAULT_UM_BASE_URL)) {
    return url;
  }
  if (!viuConfig?.umBaseUrl || viuConfig.umBaseUrl === DEFAULT_UM_BASE_URL) {
    return url;
  }
  return `${viuConfig.umBaseUrl}${url.slice(DEFAULT_UM_BASE_URL.length)}`;
};

const isUmEndpoint = (url) => url.startsWith(viuConfig.umBaseUrl);

const fetchJson = async (url, options = {}, config = {}) => {
  const normalizedUrl = normalizeUmUrl(url);
  const isUm = isUmEndpoint(normalizedUrl);
  const mergedOptions = { ...options };
  if (isUm) {
    mergedOptions.headers = buildViuHeaders(options.headers, { method: options.method });
  }

  try {
    return await fetchJsonSafe(normalizedUrl, mergedOptions, {
      timeoutMs: config.timeoutMs ?? viuConfig.timeoutMs,
      retries: config.retries ?? 2,
      retryDelayMs: config.retryDelayMs ?? 500
    });
  } catch (error) {
    if (error instanceof HttpResponseError) {
      throw new ServiceError('Upstream request failed', {
        status: error.status,
        statusText: error.statusText,
        url: error.url || normalizedUrl,
        contentType: error.contentType,
        bodySnippet: error.bodySnippet
      });
    }

    if (error instanceof ServiceError) {
      throw error;
    }

    throw new ServiceError('Upstream request failed', {
      status: null,
      statusText: error?.name || 'NetworkError',
      url: normalizedUrl,
      contentType: null,
      bodySnippet: null,
      cause: error?.message
    });
  }
};

module.exports = {
  ServiceError,
  fetchJson
};
