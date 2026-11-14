import { generatePath } from "react-router-dom";

// Every address of the app, in one place. No address is written anywhere else.
export const PATHS = {
  login: "/login",
  signup: "/signup",
  // Only sends the user on to the Dashboard.
  home: "/",
  dashboard: "/dashboard",
  directory: "/directory",
  alumniProfile: "/directory/:id",
  feed: "/feed",
  myProfile: "/profile",
  users: "/users",
  // Inside the app shell, so for logged-in users only (spec A5).
  about: "/about",
  // Development build only (TASK-010 adds the route).
  devComponents: "/dev/components",
} as const;

/** The address of one alumni profile: alumniProfilePath(7) is "/directory/7". */
export function alumniProfilePath(id: number): string {
  return generatePath(PATHS.alumniProfile, { id: String(id) });
}

// The route pattern for an address that matches no page.
export const ANY_OTHER_PATH = "*";

// Router state PublicOnly attaches when it sends a user on after a log in, so
// the shell can move focus to the page heading (an in-app move does that too).
export const AFTER_LOG_IN_STATE = { afterLogIn: true } as const;

export function isAfterLogIn(state: unknown): boolean {
  return (
    typeof state === "object" &&
    state !== null &&
    (state as { afterLogIn?: unknown }).afterLogIn === true
  );
}
