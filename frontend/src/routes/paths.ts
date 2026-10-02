export const PATHS = {
  LOGIN: "/",
  SIGNUP: "/signup",
  DASHBOARD: "/dashboard",
  PROFILE: "/profile",
  ALUMNI: "/alumni",
  ALUMNI_DETAIL: "/alumni/:id",
  POSTS: "/posts",
  ADMIN_USERS: "/admin/users",
  // Development only (registered in App.tsx when import.meta.env.DEV is true).
  DEV_COMPONENTS: "/dev/components",
} as const;

export function alumniDetailPath(id: number): string {
  return `/alumni/${id}`;
}
