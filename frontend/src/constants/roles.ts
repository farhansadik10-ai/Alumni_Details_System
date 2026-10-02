// Role values exactly as stored in "User".role and checked by the backend's requireRole.
export const ROLES = {
  STUDENT: "student",
  ALUMNI: "alumni",
  ADMIN: "admin",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ALL_ROLES: Role[] = [ROLES.STUDENT, ROLES.ALUMNI, ROLES.ADMIN];

// Q2 answer (a): the user picks student or alumni at sign-up; admin is never selectable.
export const SIGNUP_ROLES: Role[] = [ROLES.STUDENT, ROLES.ALUMNI];

export const ROLE_LABELS: Record<Role, string> = {
  student: "Student",
  alumni: "Alumni",
  admin: "Admin",
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ALL_ROLES as string[]).includes(value);
}
