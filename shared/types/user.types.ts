// A full "User" row, with `password`, so it is not exported from index.ts.
// The old app that imported it is gone. New code uses `PublicUser`.
export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
  photo_url?: string;
  login_at?: Date;
  logout_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

// It has `password`, so it is not exported from index.ts. The old app that
// imported it is gone. New code uses `SignUpUserDTO` and `UpdateUserDTO`.
export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
  role?: string;
  photo_url?: string;
}

export interface LoginUserDTO {
  email: string;
  password: string;
}

// A user as the API answers it: every "User" column except password.
// New code uses this type, not `User` above (it carries `password`).
// The four dates travel as JSON, so they are ISO date strings.
export interface PublicUser {
  id: number;
  name: string | null;
  email: string;
  role: string | null;
  photo_url: string | null;
  login_at: string | null;
  logout_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// The body of POST /api/users (sign-up). `role` is required; admin is not a choice.
export interface SignUpUserDTO {
  email: string;
  password: string;
  role: "student" | "alumni";
  name?: string | null;
  photo_url?: string | null;
}

// The body of PUT /api/users/:id. Send at least one field; `role` cannot be changed here.
export interface UpdateUserDTO {
  name?: string | null;
  // When sent, a non-empty string.
  email?: string;
  // When sent, a non-empty string.
  password?: string;
  photo_url?: string | null;
}

// The answer of POST /api/auth/login.
export interface LoginResponse {
  token: string;
}

// The body of every error answer (ADR-11).
export interface ApiError {
  error: string;
}
