import type { PublicUser, SignUpUserDTO } from "@alumni/shared";
import { apiClient } from "./apiClient";

const USERS_PATH = "/api/users";

/** Public: creates the user. It does not log them in. */
export async function signUp(body: SignUpUserDTO): Promise<PublicUser> {
  const response = await apiClient.post<PublicUser>(USERS_PATH, body, {
    skipAuthHandling: true,
  });
  return response.data;
}

export async function getUser(id: number): Promise<PublicUser> {
  const response = await apiClient.get<PublicUser>(`${USERS_PATH}/${id}`);
  return response.data;
}

/** Records the log-out time on the server. The answer is an empty 200 (G41). */
export async function logOut(id: number): Promise<void> {
  await apiClient.put(`${USERS_PATH}/${id}/logout`, undefined, {
    skipAuthHandling: true,
  });
}
