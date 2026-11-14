import { atom } from "jotai";
import type { Alumni, PublicUser, UpdateUserDTO } from "@alumni/shared";
import { presentText } from "../lib/alumniDisplay";
import { alumniFormToBody } from "../lib/alumniForm";
import type { AlumniFormValues } from "../lib/alumniForm";
import { HTTP_CONFLICT } from "../lib/loadFailure";
import { createAlumni, updateAlumni } from "../services/alumniService";
import { toApiFailure } from "../services/apiError";
import type { ApiFailure } from "../services/apiError";
import { updateUser } from "../services/userService";
import { loadMyAlumniAtom, myAlumniAtom, setMyAlumniAtom } from "./alumniAtoms";
import { setProfileUserAtom } from "./profileAtoms";
import { sessionAtom } from "./sessionAtoms";

// The two saves of My profile. Each returns a result and never throws; none
// navigates (pattern 7). An answer that arrives after the session went to
// another user is not stored: the page of that user must not show it.

export type SaveAlumniResult =
  | { ok: true; alumni: Alumni }
  | { ok: false; failure: ApiFailure };

export type SaveAccountResult =
  | { ok: true; user: PublicUser }
  | { ok: false; failure: ApiFailure };

export interface AccountInput {
  name: string;
  photoUrl: string;
}

// Nothing to save against: no session, or the profile has not loaded. The
// forms are not shown then, so no status is worth reporting: "network".
const NOT_READY: ApiFailure = { kind: "network" };

/**
 * Saves the alumni profile form: a create when the user has none, an edit
 * of the loaded profile otherwise (the id `/me` returned, G37). After a 409
 * on create the existing profile is reloaded quietly before the result is
 * returned, so the form already shows it (AC30, ADV-002).
 */
export const saveAlumniProfileAtom = atom(
  null,
  async (get, set, values: AlumniFormValues): Promise<SaveAlumniResult> => {
    const session = get(sessionAtom);
    const mine = get(myAlumniAtom);
    if (session === null) {
      return { ok: false, failure: NOT_READY };
    }
    const { userId } = session;
    const isSameUser = (): boolean => get(sessionAtom)?.userId === userId;
    const body = alumniFormToBody(values);

    let alumni: Alumni;
    if (mine.status === "ready" && mine.alumni !== null) {
      try {
        alumni = await updateAlumni(mine.alumni.id, body);
      } catch (error) {
        return { ok: false, failure: toApiFailure(error) };
      }
    } else if (mine.status === "none") {
      try {
        alumni = await createAlumni(body);
      } catch (error) {
        const failure = toApiFailure(error);
        if (failure.kind === "http" && failure.status === HTTP_CONFLICT && isSameUser()) {
          await set(loadMyAlumniAtom, { quiet: true });
        }
        return { ok: false, failure };
      }
    } else {
      return { ok: false, failure: NOT_READY };
    }

    if (isSameUser()) {
      set(setMyAlumniAtom, alumni);
    }
    return { ok: true, alumni };
  },
);

/**
 * Saves the account form (name and photo link) of the session's own user.
 * Both are trimmed; an empty one is sent as null. On success the header's
 * profile takes the answer (AC28).
 */
export const saveAccountAtom = atom(
  null,
  async (get, set, input: AccountInput): Promise<SaveAccountResult> => {
    const session = get(sessionAtom);
    if (session === null) {
      return { ok: false, failure: NOT_READY };
    }
    const { userId } = session;
    const body: UpdateUserDTO = {
      name: presentText(input.name),
      photo_url: presentText(input.photoUrl),
    };

    let user: PublicUser;
    try {
      user = await updateUser(userId, body);
    } catch (error) {
      return { ok: false, failure: toApiFailure(error) };
    }

    if (get(sessionAtom)?.userId === userId) {
      set(setProfileUserAtom, user);
    }
    return { ok: true, user };
  },
);
