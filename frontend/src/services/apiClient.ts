import axios from "axios";

// The one API client. Paths are relative (/api/...): the Vite dev server and
// Apache forward them to the backend.
//
// This file knows nothing about the store. store/wireApi.ts hands it two
// functions at start-up: how to read the token, and what to do on a 401.

declare module "axios" {
  // The type parameters must repeat the ones axios declares.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  interface AxiosRequestConfig<D = any, P = any> {
    /**
     * Set on calls where a 401 is not "your session has ended": log in
     * (wrong password), sign-up and log out.
     */
    skipAuthHandling?: boolean;
    /**
     * Set on log in and sign-up: the stored token is not sent with them (an
     * old token must not travel with a new log in). Log out still sends it.
     */
    withoutToken?: boolean;
    /** Written by the client: the token this request was sent with. */
    sentToken?: string;
  }
}

export interface ApiClientHooks {
  /** The current login token, or null when nobody is logged in. */
  getToken: () => string | null;
  /** Called when the server refuses the current token. */
  onUnauthorized: () => void;
}

const UNAUTHORIZED_STATUS = 401;

let hooks: ApiClientHooks = {
  getToken: () => null,
  onUnauthorized: () => undefined,
};

export function configureApiClient(next: ApiClientHooks): void {
  hooks = next;
}

export const apiClient = axios.create();

apiClient.interceptors.request.use((config) => {
  const token = config.withoutToken === true ? null : hooks.getToken();
  if (token !== null) {
    config.headers.set("Authorization", `Bearer ${token}`);
    config.sentToken = token;
  }
  return config;
});

apiClient.interceptors.response.use(undefined, (error: unknown) => {
  if (
    axios.isAxiosError(error) &&
    error.response?.status === UNAUTHORIZED_STATUS &&
    error.config !== undefined &&
    error.config.skipAuthHandling !== true &&
    error.config.sentToken !== undefined &&
    // An answer to an older token says nothing about the one in use now.
    error.config.sentToken === hooks.getToken()
  ) {
    hooks.onUnauthorized();
  }
  return Promise.reject(error);
});
