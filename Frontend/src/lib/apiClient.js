import axios from "axios";

export const API_BASE =
  import.meta.env.VITE_BASE_URL ||
  "http://localhost:5000";

// A request must never leave a page in an indefinite loading state.
export const REQUEST_TIMEOUT = 7000;
const RETRY_DELAY = 500;
const RETRY_STATUSES = new Set([502, 503, 504]);

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: REQUEST_TIMEOUT,
  headers: {
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error?.config;

    if (!config || config.method?.toLowerCase() !== "get") {
      return Promise.reject(error);
    }

    const status = error?.response?.status;
    const retryable =
      RETRY_STATUSES.has(status) ||
      error?.code === "ECONNABORTED" ||
      error?.code === "ETIMEDOUT" ||
      !error?.response;

    if (!retryable || config.__booklyRetry) {
      return Promise.reject(error);
    }

    config.__booklyRetry = true;

    await new Promise((resolve) =>
      setTimeout(resolve, RETRY_DELAY)
    );

    return apiClient(config);
  }
);

export const isRequestCanceled = (error) =>
  error?.code === "ERR_CANCELED" ||
  error?.name === "CanceledError" ||
  axios.isCancel(error);

// Only this helper's returned value is allowed into user-facing
// request error components. Technical error details stay in the console.
export const getUserFacingError = (
  error,
  fallback = "Something went wrong. Please try again."
) => {
  if (isRequestCanceled(error)) {
    return "The request was cancelled.";
  }

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return "You appear to be offline. Check your connection and try again.";
  }

  if (
    error?.code === "ECONNABORTED" ||
    error?.code === "ETIMEDOUT"
  ) {
    return "The server is taking longer than expected. Please try again.";
  }

  if (!error?.response) {
    return "We couldn't reach Bookly right now. Please check your connection and try again.";
  }

  switch (error.response.status) {
    case 400:
      return "That request couldn't be completed. Please try again.";
    case 401:
      return "Your session has expired. Please sign in again.";
    case 403:
      return "You don't have permission to do that.";
    case 404:
      return "We couldn't find what you were looking for.";
    case 408:
      return "The request took too long. Please try again.";
    case 409:
      return "That change couldn't be saved right now. Please try again.";
    case 429:
      return "Bookly is receiving a lot of requests. Please try again in a moment.";
    case 502:
    case 503:
    case 504:
      return "The Bookly service is temporarily unavailable. Please try again shortly.";
    default:
      return fallback;
  }
};

export default apiClient;
