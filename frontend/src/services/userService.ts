import type {
  Paged,
  PublicUser,
  SignUpUserDTO,
  UpdateUserDTO,
} from "@alumni/shared";
import { apiClient } from "./apiClient";

const USERS_PATH = "/api/users";
// A hung server must not keep the user logged in: the action clears the
// session when this call fails or times out.
const LOGOUT_TIMEOUT_MS = 5000;

/**
 * The query of GET /api/users (admin only). A key left out is no filter: `q`
 * matches name or email, `role` is a stored role word. `limit` is sent only
 * when given; without it the server's default page size is used.
 */
export interface UserListParams {
  q?: string;
  role?: string;
  page?: number;
  limit?: number;
}

// A cancelled call (its `signal` aborted) rejects; tell it apart from a
// failure with `isCancelled` from apiError.ts.

/** One page of users. The rows have no password column. */
export async function listUsers(
  params: UserListParams,
  signal?: AbortSignal,
): Promise<Paged<PublicUser>> {
  const response = await apiClient.get<Paged<PublicUser>>(USERS_PATH, {
    params,
    signal,
  });
  return response.data;
}

/** Admin only. A 409 means the user still owns content (ADR-06). */
export async function deleteUser(id: number): Promise<void> {
  await apiClient.delete(`${USERS_PATH}/${id}`);
}

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
