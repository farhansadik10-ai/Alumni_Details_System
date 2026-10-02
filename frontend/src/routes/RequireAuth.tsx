import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useAtomValue } from "jotai";
import { Navigate, useLocation } from "react-router-dom";
import { currentUserAtom } from "../store/authAtom";
import { isExpired } from "../utils/jwt";
import { PATHS } from "./paths";

// Router state passed to the login page by RequireAuth.
export interface LoginLocationState {
  // Where to go back to after logging in.
  from?: string;
  // True when the user had a token that has expired.
  expired?: boolean;
}

export interface RequireAuthProps {
  children: ReactNode;
}

// setTimeout fires immediately for delays above 2^31-1 ms (~24.8 days).
const MAX_TIMEOUT_MS = 2_147_483_647;

// Renders the children only with a valid, unexpired token; otherwise redirects to the login page.
// The token is only decoded here; a token the backend rejects is caught by the apiClient 401 redirect.
export default function RequireAuth({ children }: RequireAuthProps) {
  const user = useAtomValue(currentUserAtom);
  const location = useLocation();
  const [, setExpiryTick] = useState(0);

  // Re-render when the token expires, so an idle page also goes to the login page.
  useEffect(() => {
    if (!user || user.expiresAt === null) return;
    const delay = user.expiresAt - Date.now();
    if (delay <= 0) return;
    const timer = setTimeout(() => setExpiryTick((n) => n + 1), Math.min(delay, MAX_TIMEOUT_MS));
    return () => clearTimeout(timer);
  }, [user]);

  if (!user || isExpired(user)) {
    const state: LoginLocationState = {
      from: location.pathname + location.search,
      expired: user !== null,
    };
    return <Navigate to={PATHS.LOGIN} replace state={state} />;
  }

  return <>{children}</>;
}
