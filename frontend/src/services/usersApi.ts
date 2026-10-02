import axios from "axios";
import type { CreateUserDTO } from "@alumni/shared/types/user.types";
import apiClient from "./apiClient";
import type { ApiErrorBody, ApiUser } from "../types/api";

// The backend still returns the password hash (plan L.1); never keep it in the frontend.
function withoutPassword(raw: ApiUser & { password?: string }): ApiUser {
  const user = { ...raw };
  delete user.password;
  return user;
}

// The backend passes the PostgreSQL error through as 400 { error }; a taken email breaks the
// UNIQUE constraint "User_email_key" (db/schema.md).
function isDuplicateEmail(error: unknown): boolean {
  if (!axios.isAxiosError<ApiErrorBody>(error) || error.response?.status !== 400) return false;
  return /User_email_key/.test(error.response.data?.error ?? "");
}

// Public sign-up. Sent without the stored token: the route needs none, and a stale one must not matter.
export async function createUser(body: CreateUserDTO): Promise<ApiUser> {
  try {
    const res = await apiClient.post<ApiUser & { password?: string }>("/api/users", body, {
      skipAuthRedirect: true,
    });
    return withoutPassword(res.data);
  } catch (err) {
    if (isDuplicateEmail(err)) throw new Error("This email is already registered");
    throw err;
  }
}

export async function getUserById(id: number): Promise<ApiUser> {
  const res = await apiClient.get<(ApiUser & { password?: string }) | "" | null>(`/api/users/${id}`);
  // An unknown id comes back as 200 with an empty body.
  if (!res.data) throw new Error("User not found");
  return withoutPassword(res.data);
}

// Records logout_at for the user; the caller clears the token afterwards.
export async function logout(id: number): Promise<void> {
  await apiClient.put(`/api/users/${id}/logout`);
}
