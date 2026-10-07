import axios from "axios";

export const API_BASE =
  import.meta.env.VITE_BASE_URL ||
  "http://localhost:5000";

export const API_TIMEOUT = 8000;

const CATALOG_CACHE_KEY = "bookly:catalog:v3";
const CATALOG_TTL = 10 * 60 * 1000;
const RETRY_DELAY = 500;
const MAX_GET_RETRIES = 1;

export const api = axios.create({
  baseURL: API_BASE,
  timeout: API_TIMEOUT,
});

let memoryCatalog = null;
let memoryCatalogAt = 0;
let catalogRequest = null;

const sleep = (ms) =>
  new Promise((resolve) =>
    setTimeout(resolve, ms)
  );

const isRetryableGetError = (error) => {
  if (!error?.response) {
    return true;
  }

  return [502, 503, 504].includes(
    error.response.status
  );
};

export const getFriendlyError = (
  error,
  fallback = "Something went wrong. Please try again."
) => {
  if (error?.code === "ECONNABORTED" || error?.code === "ETIMEDOUT") {
    return "The server took too long to respond. Please try again.";
  }

  if (!error?.response) {
    return "We couldn't reach the library right now. Please check your connection and try again.";
  }

  if ([502, 503, 504].includes(error.response.status)) {
    return "The library server is temporarily unavailable. Please try again in a moment.";
  }

  if (error.response.status === 401) {
    return "Your session has expired. Please sign in again.";
  }

  if (error.response.status === 403) {
    return "You don't have permission to do that.";
  }

  return fallback;
};

const requestGetWithRetry = async (config) => {
  let lastError = null;

  for (let attempt = 0; attempt <= MAX_GET_RETRIES; attempt += 1) {
    try {
      return await api.get(config.url, config.options || {});
    } catch (error) {
      lastError = error;

      if (
        attempt >= MAX_GET_RETRIES ||
        !isRetryableGetError(error)
      ) {
        throw error;
      }

      await sleep(RETRY_DELAY);
    }
  }

  throw lastError;
};

const readStoredCatalog = () => {
  try {
    const raw = sessionStorage.getItem(
      CATALOG_CACHE_KEY
    );

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);

    if (
      !Array.isArray(parsed?.data) ||
      !parsed?.timestamp
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

const writeStoredCatalog = (data) => {
  try {
    sessionStorage.setItem(
      CATALOG_CACHE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        data,
      })
    );
  } catch {
    // Storage is optional. Memory cache still works.
  }
};

export const refreshCatalog = async () => {
  if (catalogRequest) {
    return catalogRequest;
  }

  catalogRequest = requestGetWithRetry({
    url: "/api/book/getBooks",
  })
    .then((response) => {
      const data = Array.isArray(response.data)
        ? response.data
        : [];

      memoryCatalog = data;
      memoryCatalogAt = Date.now();
      writeStoredCatalog(data);

      return data;
    })
    .finally(() => {
      catalogRequest = null;
    });

  return catalogRequest;
};

export const getCatalog = async ({
  force = false,
} = {}) => {
  const now = Date.now();

  if (
    !force &&
    Array.isArray(memoryCatalog) &&
    now - memoryCatalogAt < CATALOG_TTL
  ) {
    return memoryCatalog;
  }

  if (!force) {
    const stored = readStoredCatalog();

    if (stored) {
      memoryCatalog = stored.data;
      memoryCatalogAt = stored.timestamp;

      if (
        now - stored.timestamp >= CATALOG_TTL &&
        !catalogRequest
      ) {
        void refreshCatalog().catch(() => {});
      }

      return stored.data;
    }
  }

  return refreshCatalog();
};

export const clearCatalogCache = () => {
  memoryCatalog = null;
  memoryCatalogAt = 0;

  try {
    sessionStorage.removeItem(
      CATALOG_CACHE_KEY
    );
  } catch {
    // Ignore storage errors.
  }
};

export const getBookByIdentifier = async (
  identifier
) => {
  const target = String(identifier || "").trim();

  if (!target) {
    throw new Error("Missing book identifier");
  }

  try {
    const catalog = await getCatalog();
    const localBook = catalog.find(
      (book) => book?.identifier === target
    );

    if (localBook) {
      return localBook;
    }
  } catch {
    // Fall back to the direct endpoint below.
  }

  const response = await api.get(
    `/api/book/${encodeURIComponent(target)}`
  );

  return response.data;
};
