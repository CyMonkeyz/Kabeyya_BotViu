const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class ServiceError extends Error {
  constructor(message, meta = {}) {
    super(message);
    this.name = 'ServiceError';
    this.meta = meta;
    this.isServiceError = true;
  }
}

const isLikelyJson = (bodyText) => {
  const trimmed = bodyText.trim();
  return trimmed.startsWith('{') || trimmed.startsWith('[');
};

const buildHeadersSubset = (headers) => {
  const allowList = [
    'content-type',
    'content-length',
    'cache-control',
    'date',
    'server',
    'via',
    'location',
    'x-request-id',
    'x-amzn-requestid',
    'x-amz-request-id',
    'x-cache',
    'cf-ray'
  ];
  const subset = {};
  allowList.forEach((name) => {
    const value = headers.get(name);
    if (value) {
      subset[name] = value;
    }
  });
  return subset;
};

const shouldRetryError = (error) => {
  if (error instanceof ServiceError) {
    return [429, 502, 503, 504].includes(error.meta?.status);
  }
  if (error?.name === 'AbortError') {
    return true;
  }
  return ['ETIMEDOUT', 'ECONNRESET', 'ENOTFOUND', 'EAI_AGAIN'].includes(error?.code);
};

const fetchJson = async (url, options = {}, config = {}) => {
  const {
    timeoutMs = 15000,
    retries = 2,
    retryDelayMs = 500
  } = config;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      const bodyText = await response.text();
      const contentType = response.headers.get('content-type') || '';
      const jsonContentType = contentType.includes('application/json') || contentType.includes('+json');
      const looksJson = isLikelyJson(bodyText);
      const bodySnippet = bodyText.slice(0, 300);
      const meta = {
        status: response.status,
        statusText: response.statusText,
        url: response.url || url,
        contentType,
        bodySnippet,
        headersSubset: buildHeadersSubset(response.headers)
      };

      if (!response.ok) {
        throw new ServiceError('Upstream request failed', meta);
      }

      if (!jsonContentType && !looksJson) {
        // Some upstream endpoints return HTML (maintenance/WAF/redirect pages).
        console.warn('Upstream returned non-JSON response', {
          status: meta.status,
          contentType: meta.contentType,
          url: meta.url,
          bodySnippet: meta.bodySnippet
        });
        throw new ServiceError('Upstream returned non-JSON response', meta);
      }

      try {
        return JSON.parse(bodyText);
      } catch (parseError) {
        throw new ServiceError('Upstream returned invalid JSON', meta);
      }
    } catch (error) {
      const canRetry = attempt < retries && shouldRetryError(error);
      if (canRetry) {
        await sleep(retryDelayMs * (2 ** attempt));
        continue;
      }

      if (error instanceof ServiceError) {
        throw error;
      }

      throw new ServiceError('Upstream request failed', {
        status: null,
        statusText: error?.name || 'NetworkError',
        url,
        contentType: null,
        bodySnippet: null,
        headersSubset: {},
        cause: error?.message
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  return null;
};

module.exports = {
  ServiceError,
  fetchJson
};
