const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class HttpResponseError extends Error {
  constructor({
    status,
    statusText,
    url,
    contentType,
    bodySnippet,
    isJson
  }) {
    super(
      `HTTP ${status} ${statusText} from ${url} (content-type: ${contentType || 'unknown'}) `
      + `body: ${bodySnippet || '<empty>'}`
    );
    this.name = 'HttpResponseError';
    this.status = status;
    this.statusText = statusText;
    this.url = url;
    this.contentType = contentType;
    this.bodySnippet = bodySnippet;
    this.isJson = isJson;
  }
}

const shouldRetryError = (error) => {
  if (error instanceof HttpResponseError) {
    return [502, 503, 504].includes(error.status);
  }
  if (error?.name === 'AbortError') {
    return true;
  }
  return ['ETIMEDOUT', 'ECONNRESET', 'ENOTFOUND', 'EAI_AGAIN'].includes(error?.code);
};

const fetchJsonSafe = async (url, options = {}, config = {}) => {
  const {
    timeoutMs = 15000,
    retries = 1,
    retryDelayMs = 500
  } = config;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      const bodyText = await response.text();
      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');

      if (!response.ok || !isJson) {
        throw new HttpResponseError({
          status: response.status,
          statusText: response.statusText,
          url: response.url || url,
          contentType,
          bodySnippet: bodyText.slice(0, 300),
          isJson
        });
      }

      try {
        return JSON.parse(bodyText);
      } catch (parseError) {
        throw new HttpResponseError({
          status: response.status,
          statusText: 'Invalid JSON',
          url: response.url || url,
          contentType,
          bodySnippet: bodyText.slice(0, 300),
          isJson
        });
      }
    } catch (error) {
      const canRetry = attempt < retries && shouldRetryError(error);
      if (canRetry) {
        await sleep(retryDelayMs);
        continue;
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  return null;
};

module.exports = {
  HttpResponseError,
  fetchJsonSafe
};
