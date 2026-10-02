import apiClient from "./apiClient";
import type { ApiUser } from "../types/api";

// The backend still returns the password hash (plan L.1); never keep it in the frontend.
function withoutPassword(raw: ApiUser & { password?: string }): ApiUser {
  const user = { ...raw };
  delete user.password;
  return user;
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
