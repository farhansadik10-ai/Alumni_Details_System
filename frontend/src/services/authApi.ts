import apiClient from "./apiClient";
import type { LoginRequest, LoginResponse } from "../types/api";

export async function login(email: string, password: string): Promise<LoginResponse> {
  const body: LoginRequest = { email, password };

  // A 401 here means wrong email or password: the form shows it, no session-expired redirect.
  const res = await apiClient.post<LoginResponse>("/api/auth/login", body, {
    skipAuthRedirect: true,
  });

  return res.data;
}
