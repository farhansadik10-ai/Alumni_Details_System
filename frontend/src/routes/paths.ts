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
  // Development build only (TASK-010 adds the route).
  devComponents: "/dev/components",
} as const;

// The route pattern for an address that matches no page.
export const ANY_OTHER_PATH = "*";
