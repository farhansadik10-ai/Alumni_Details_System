import type { LoginUserDTO, User } from "@alumni/shared/types/user.types";

// Error bodies sent by the backend: auth routes use `message`, controllers use `error`.
export interface ApiErrorBody {
  message?: string;
  error?: string;
}

export type LoginRequest = LoginUserDTO;

export interface LoginResponse {
  token: string;
}

type DateFields = "login_at" | "logout_at" | "created_at" | "updated_at";

// A user as the frontend sees it: dates arrive as JSON strings (or null), and the
// password hash the backend still returns (see plan L.1) is stripped in usersApi.
export type ApiUser = Omit<User, "password" | DateFields> & {
  [K in DateFields]?: string | null;
};
