import axios from "axios";
import { PATHS } from "../routes/paths";
import { TOKEN_STORAGE_KEY } from "../store/authAtom";
import type { ApiErrorBody } from "../types/api";

declare module "axios" {
  interface AxiosRequestConfig {
    // Set on requests whose 401 means "wrong credentials", not "session expired"
    // (the login call), so the caller handles the error itself.
    skipAuthRedirect?: boolean;
  }
}

// Relative /api paths: the Vite dev proxy forwards them in development, Apache in production.
const apiClient = axios.create();

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token && !config.skipAuthRedirect) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      !error.config?.skipAuthRedirect
    ) {
      // Token missing, invalid or expired: drop it and start a fresh session at the login page.
      // A full page load also resets the Jotai atoms, which are seeded from localStorage.
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      if (window.location.pathname !== PATHS.LOGIN) {
        window.location.assign(PATHS.LOGIN);
      }
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    return error.response?.data?.message || error.response?.data?.error || fallback;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export default apiClient;
