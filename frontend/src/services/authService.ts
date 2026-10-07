import type { LoginResponse, LoginUserDTO } from "@alumni/shared";
import { apiClient } from "./apiClient";

const LOGIN_PATH = "/api/auth/login";

/** A 401 here means a wrong email or password, not an ended session. */
export async function logIn(body: LoginUserDTO): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>(LOGIN_PATH, body, {
    skipAuthHandling: true,
    withoutToken: true,
  });
  return response.data;
}
