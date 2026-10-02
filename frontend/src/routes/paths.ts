export const PATHS = {
  LOGIN: "/",
  SIGNUP: "/signup",
  DASHBOARD: "/dashboard",
  PROFILE: "/profile",
  ALUMNI: "/alumni",
  ALUMNI_DETAIL: "/alumni/:id",
  POSTS: "/posts",
  ADMIN_USERS: "/admin/users",
} as const;

export function alumniDetailPath(id: number): string {
  return `/alumni/${id}`;
}
