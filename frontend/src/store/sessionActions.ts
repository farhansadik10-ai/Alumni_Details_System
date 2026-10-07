import { atom } from "jotai";
import type { SignUpUserDTO } from "@alumni/shared";
import { REMEMBERED_EMAIL_STORAGE_KEY } from "../config/storageKeys";
import { removeStored, writeStored } from "../lib/browserStorage";
import { readToken } from "../lib/token";
import { toApiFailure } from "../services/apiError";
import type { ApiFailure } from "../services/apiError";
import { logIn } from "../services/authService";
import { logOut, signUp } from "../services/userService";
import { IDLE_PROFILE, profileAtom } from "./profileAtoms";
import {
  adoptStoredTokenAtom,
  authNoticeAtom,
  sessionAtom,
  tokenAtom,
} from "./sessionAtoms";
import type { AuthNotice } from "./sessionAtoms";

// The session actions. Each is a write-only atom that returns a result and
// never throws. None of them navigates: the route guards do that when they
// see the session change (architecture.md, "Session").
//
// Jotai tells its listeners once per synchronous write. After an `await` every
// `set` would tell them on its own, so each change of more than one atom goes
// through one of the two small atoms below. The guards then never see a
// half-changed session.

export interface LogInInput {
  email: string;
  password: string;
  rememberEmail: boolean;
}

export type LogInResult = { ok: true } | { ok: false; failure: ApiFailure };

export type SignUpResult =
  | { ok: true; loggedIn: boolean }
  | { ok: false; failure: ApiFailure };

type TokenResult =
  | { ok: true; token: string }
  | { ok: false; failure: ApiFailure };

// A 200 that carries no readable token (for example a proxy answering with a
// web page). There is no status worth showing, so it counts as "network".
const UNREADABLE_ANSWER: ApiFailure = { kind: "network" };

const clearSessionAtom = atom(null, (_get, set, notice: AuthNotice) => {
  set(tokenAtom, null);
  set(profileAtom, IDLE_PROFILE);
  set(authNoticeAtom, notice);
});

// The token goes last: setting it is what makes the PublicOnly guard leave.
const startSessionAtom = atom(null, (_get, set, token: string) => {
  set(profileAtom, IDLE_PROFILE);
  set(authNoticeAtom, null);
  set(tokenAtom, token);
});

// The password is sent exactly as typed.
async function requestToken(email: string, password: string): Promise<TokenResult> {
  try {
    const { token } = await logIn({ email, password });
    if (typeof token !== "string" || readToken(token) === null) {
      return { ok: false, failure: UNREADABLE_ANSWER };
    }
    return { ok: true, token };
  } catch (error) {
    return { ok: false, failure: toApiFailure(error) };
  }
}

/**
 * Logs in. The email is trimmed and its letter case kept. On success the
 * email is remembered or forgotten first, because the log-in page may be gone
 * the moment the token is set.
 */
export const logInAtom = atom(
  null,
  async (_get, set, input: LogInInput): Promise<LogInResult> => {
    const email = input.email.trim();
    const result = await requestToken(email, input.password);
    if (!result.ok) {
      return result;
    }

    if (input.rememberEmail) {
      writeStored(REMEMBERED_EMAIL_STORAGE_KEY, email);
    } else {
      removeStored(REMEMBERED_EMAIL_STORAGE_KEY);
    }
    set(startSessionAtom, result.token);
    return { ok: true };
  },
);

/**
 * Creates the user, then logs in with the same email and password. Name,
 * email and photo link are trimmed; an empty name or photo link is sent as
 * null. `loggedIn: false` means the account exists but the log in failed.
 * The remembered email is left as it is.
 */
export const signUpAtom = atom(
  null,
  async (_get, set, input: SignUpUserDTO): Promise<SignUpResult> => {
    const body: SignUpUserDTO = {
      email: input.email.trim(),
      password: input.password,
      role: input.role,
      name: input.name?.trim() || null,
      photo_url: input.photo_url?.trim() || null,
    };

    try {
      await signUp(body);
    } catch (error) {
      return { ok: false, failure: toApiFailure(error) };
    }

    const result = await requestToken(body.email, body.password);
    if (!result.ok) {
      return { ok: true, loggedIn: false };
    }
    set(startSessionAtom, result.token);
    return { ok: true, loggedIn: true };
  },
);

/**
 * Tells the server, then logs out here whatever the server said (AC43).
 * Token, profile and the "loggedOut" notice change in one store update.
 */
export const logOutAtom = atom(null, async (get, set): Promise<void> => {
  const session = get(sessionAtom);
  if (session !== null) {
    try {
      await logOut(session.userId);
    } catch {
      // The user asked to leave; a failed call does not keep them in.
    }
  }
  set(clearSessionAtom, "loggedOut");
});

/**
 * Ends a dead session: a 401, a token that ran out, a stored token that
 * cannot be read. The only way such a session is cleared; the log-in page
 * then shows the session-ended message.
 */
export const endSessionAtom = atom(null, (_get, set) => {
  set(clearSessionAtom, "sessionEnded");
});

/**
 * Another tab logged in or out: follow it. The profile is dropped when the
 * user is no longer the same one, so the old name is never shown to the new
 * user. The notice is left alone.
 */
export const tokenChangedElsewhereAtom = atom(
  null,
  (get, set, token: string | null) => {
    const userIdBefore = get(sessionAtom)?.userId;
    set(adoptStoredTokenAtom, token);
    if (get(sessionAtom)?.userId !== userIdBefore) {
      set(profileAtom, IDLE_PROFILE);
    }
  },
);
