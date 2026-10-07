import { apiClient } from "./apiClient";

const USER_CACHE_TTL = 15000;

const cache = {
  progress: { data: null, time: 0 },
  readBooks: { data: null, time: 0 },
  recentBooks: { data: null, time: 0 },
  collections: { data: null, time: 0 },
  notes: { data: null, time: 0 },
};

const inFlight = new Map();
let cacheIdentity = null;

const getIdentity = () =>
  localStorage.getItem("token") || "anonymous";

const resetIfIdentityChanged = () => {
  const identity = getIdentity();

  if (cacheIdentity === null) {
    cacheIdentity = identity;
    return;
  }

  if (cacheIdentity !== identity) {
    Object.keys(cache).forEach((key) => {
      cache[key] = { data: null, time: 0 };
    });
    inFlight.clear();
    cacheIdentity = identity;
  }
};

const hasFreshData = (entry) =>
  entry.data !== null &&
  Date.now() - entry.time < USER_CACHE_TTL;

const cachedRequest = (key, request, force = false) => {
  resetIfIdentityChanged();

  const entry = cache[key];

  if (!force && entry && hasFreshData(entry)) {
    return Promise.resolve(entry.data);
  }

  if (!force && inFlight.has(key)) {
    return inFlight.get(key);
  }

  const promise = request()
    .then((data) => {
      cache[key] = {
        data,
        time: Date.now(),
      };
      return data;
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, promise);
  return promise;
};

export const getUserProgress = ({ force = false } = {}) =>
  cachedRequest(
    "progress",
    async () => {
      const response = await apiClient.get(
        "/api/users/get-user-progress"
      );

      const progress = response.data?.progress || {};

      return {
        ...progress,
        recentReadBooks: Array.isArray(progress.recentReadBooks)
          ? progress.recentReadBooks
          : [],
        totalReadBooks: progress.totalReadBooks ?? 0,
        goal: response.data?.goal ?? 0,
      };
    },
    force
  );

export const getReadBooks = ({ force = false } = {}) =>
  cachedRequest(
    "readBooks",
    async () => {
      const response = await apiClient.get(
        "/api/users/checkReadBooks"
      );

      return Array.isArray(response.data?.data)
        ? response.data.data
        : [];
    },
    force
  );

export const getRecentBooks = ({ force = false } = {}) =>
  cachedRequest(
    "recentBooks",
    async () => {
      const response = await apiClient.get(
        "/api/users/get-recent-books"
      );

      return Array.isArray(response.data?.recentBooks)
        ? response.data.recentBooks
        : [];
    },
    force
  );

export const getCollections = ({ force = false } = {}) =>
  cachedRequest(
    "collections",
    async () => {
      const response = await apiClient.get(
        "/api/users/collections"
      );

      return Array.isArray(response.data?.collections)
        ? response.data.collections
        : [];
    },
    force
  );

export const getNotes = ({ force = false } = {}) =>
  cachedRequest(
    "notes",
    async () => {
      const response = await apiClient.get(
        "/api/users/getnotes"
      );

      return Array.isArray(response.data)
        ? response.data
        : [];
    },
    force
  );

export const invalidateUserCache = (...keys) => {
  resetIfIdentityChanged();

  const targets = keys.length
    ? keys
    : Object.keys(cache);

  targets.forEach((key) => {
    if (!cache[key]) return;
    cache[key] = { data: null, time: 0 };
  });
};
