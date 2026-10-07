import type {
  PublicUser,
  SignUpUserDTO,
  UpdateUserDTO,
} from "@alumni/shared";
import { apiClient } from "./apiClient";

const USERS_PATH = "/api/users";
// A hung server must not keep the user logged in: the action clears the
// session when this call fails or times out.
const LOGOUT_TIMEOUT_MS = 5000;

/** Public: creates the user. It does not log them in. */
export async function signUp(body: SignUpUserDTO): Promise<PublicUser> {
  const response = await apiClient.post<PublicUser>(USERS_PATH, body, {
    skipAuthHandling: true,
    withoutToken: true,
  });
  return response.data;
}

export async function getUser(id: number): Promise<PublicUser> {
  const response = await apiClient.get<PublicUser>(`${USERS_PATH}/${id}`);
  return response.data;
}

/** Only the fields sent are written. The answer has no password column. */
export async function updateUser(
  id: number,
  body: UpdateUserDTO,
): Promise<PublicUser> {
  const response = await apiClient.put<PublicUser>(`${USERS_PATH}/${id}`, body);
  return response.data;
}

/** Records the log-out time on the server. The answer is an empty 200 (G41). */
export async function logOut(id: number): Promise<void> {
  await apiClient.put(`${USERS_PATH}/${id}/logout`, undefined, {
    skipAuthHandling: true,
    timeout: LOGOUT_TIMEOUT_MS,
  });
}
