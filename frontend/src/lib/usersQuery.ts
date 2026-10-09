// The Users page's search, role filter and page, as kept in the address.
// The address is the truth: the page reads it through readUsersQuery and
// writes it through writeUsersQuery, so a bad value never reaches the page.

import { PAGE_KEY, readPageParam, singleParam } from "./addressParams";
import { asRole, type Role } from "./token";

/** The users query after reading the address. "" means "not set". */
export interface UsersQuery {
  q: string;
  role: "" | Role;
  page: number;
}

export const DEFAULT_USERS_QUERY: UsersQuery = {
  q: "",
  role: "",
  page: 1,
};

/**
 * The query of GET /api/users. The same keys as `UserListParams` in
 * services/userService.ts, without `limit`; it is repeated here because lib/
 * does not import services/.
 */
export interface UserListParams {
  q?: string;
  role?: Role;
  page?: number;
}

// The address keys, in the order they are written (the same query always
// gives the same address text).
const Q_KEY = "q";
const ROLE_KEY = "role";
// The page key is PAGE_KEY from addressParams.ts, written last.

/** A role word exactly as stored (lower case), else "" (all roles). */
function readRole(value: string | null): "" | Role {
  return (value === null ? null : asRole(value)) ?? "";
}

/**
 * Reads the users query from the address. Anything bad falls back to its
 * default: a key sent twice is absent, a role that is not one of the three
 * words is "all roles", a page that is not 1 to 9999999 is 1.
 */
export function readUsersQuery(params: URLSearchParams): UsersQuery {
  const q = singleParam(params, Q_KEY);
  return {
    q: q === null ? "" : q.trim(),
    role: readRole(singleParam(params, ROLE_KEY)),
    page: readPageParam(params),
  };
}

/** The address for a query: only the values that are set; page 1 is left out. */
export function writeUsersQuery(query: UsersQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.q !== "") {
    params.set(Q_KEY, query.q);
  }
  if (query.role !== "") {
    params.set(ROLE_KEY, query.role);
  }
  if (query.page > 1) {
    params.set(PAGE_KEY, String(query.page));
  }
  return params;
}

/** The request query for the list. `limit` is never sent (the server's page size is used). */
export function toUserListParams(query: UsersQuery): UserListParams {
  const params: UserListParams = {};
  if (query.q !== "") {
    params.q = query.q;
  }
  if (query.role !== "") {
    params.role = query.role;
  }
  if (query.page > 1) {
    params.page = query.page;
  }
  return params;
}

/** True when the search text or the role filter is set: an empty result then offers "Clear". */
export function hasUsersCriteria(query: UsersQuery): boolean {
  return query.q !== "" || query.role !== "";
}
