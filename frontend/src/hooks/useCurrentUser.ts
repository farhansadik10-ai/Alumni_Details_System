import { useEffect, useState } from "react";
import { useAtomValue } from "jotai";
import { currentUserAtom } from "../store/authAtom";
import { getUserById } from "../services/usersApi";
import { isExpired } from "../utils/jwt";
import useRequest from "./useRequest";
import type { CurrentUser } from "../types/auth";
import type { ApiUser } from "../types/api";

export interface UseCurrentUserResult {
  // From the token: id and role. Null when logged out, the token is invalid, or it has expired.
  user: CurrentUser | null;
  expired: boolean;
  // From GET /api/users/:id: name, email, photo_url, ...
  profile: ApiUser | undefined;
  profileLoading: boolean;
  profileError: unknown;
  reloadProfile: () => void;
}

// setTimeout fires immediately for delays above 2^31-1 ms (~24.8 days).
const MAX_TIMEOUT_MS = 2_147_483_647;

export default function useCurrentUser(): UseCurrentUserResult {
  const decoded = useAtomValue(currentUserAtom);
  const [now, setNow] = useState(() => Date.now());

  // Re-render when the token expires, so `user` turns null without a page reload.
  useEffect(() => {
    if (!decoded || decoded.expiresAt === null) return;
    const delay = decoded.expiresAt - Date.now();
    if (delay <= 0) {
      setNow(Date.now());
      return;
    }
    const timer = setTimeout(() => setNow(Date.now()), Math.min(delay, MAX_TIMEOUT_MS));
    return () => clearTimeout(timer);
  }, [decoded, now]);

  const expired = decoded !== null && isExpired(decoded, now);
  const user = expired ? null : decoded;
  const userId = user?.id;

  const { data, loading, error, reload } = useRequest(
    () => getUserById(userId as number),
    [userId],
    { enabled: userId !== undefined }
  );

  return {
    user,
    expired,
    profile: userId !== undefined ? data : undefined,
    profileLoading: loading,
    profileError: error,
    reloadProfile: reload,
  };
}
