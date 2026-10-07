const CACHE_PREFIX = "bookly:user-data:v1:";
const DEFAULT_TTL = 2 * 60 * 1000;

const memory = new Map();
const requests = new Map();

const getKey = (token, resource) =>
  `${CACHE_PREFIX}${resource}:${token}`;

const readStorage = (key) => {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.data) && typeof parsed.data !== "object") {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

const writeStorage = (key, data) => {
  try {
    sessionStorage.setItem(
      key,
      JSON.stringify({
        timestamp: Date.now(),
        data,
      })
    );
  } catch {
    // Storage is optional.
  }
};

export const getCachedUserData = async ({
  token,
  resource,
  fetcher,
  ttl = DEFAULT_TTL,
  force = false,
}) => {
  if (!token) {
    throw new Error("AUTH_REQUIRED");
  }

  const key = getKey(token, resource);
  const now = Date.now();
  const memoryEntry = memory.get(key);

  if (
    !force &&
    memoryEntry &&
    now - memoryEntry.timestamp < ttl
  ) {
    return memoryEntry.data;
  }

  if (!force) {
    const stored = readStorage(key);

    if (stored) {
      memory.set(key, stored);

      if (now - stored.timestamp < ttl) {
        return stored.data;
      }

      // Stale-while-revalidate:
      // return stale data immediately and refresh in background.
      if (!requests.has(key)) {
        const backgroundRequest = Promise.resolve()
          .then(fetcher)
          .then((data) => {
            const entry = {
              timestamp: Date.now(),
              data,
            };
            memory.set(key, entry);
            writeStorage(key, data);
            return data;
          })
          .catch(() => null)
          .finally(() => {
            requests.delete(key);
          });

        requests.set(key, backgroundRequest);
      }

      return stored.data;
    }
  }

  if (requests.has(key)) {
    return requests.get(key);
  }

  const request = Promise.resolve()
    .then(fetcher)
    .then((data) => {
      const entry = {
        timestamp: Date.now(),
        data,
      };

      memory.set(key, entry);
      writeStorage(key, data);

      return data;
    })
    .finally(() => {
      requests.delete(key);
    });

  requests.set(key, request);

  return request;
};

export const updateCachedUserData = ({
  token,
  resource,
  data,
}) => {
  if (!token) return;

  const key = getKey(token, resource);
  const entry = {
    timestamp: Date.now(),
    data,
  };

  memory.set(key, entry);
  writeStorage(key, data);
};

export const clearCachedUserData = ({
  token,
  resource,
}) => {
  if (!token) return;

  const key = getKey(token, resource);

  memory.delete(key);

  try {
    sessionStorage.removeItem(key);
  } catch {
    // Ignore storage errors.
  }
};
