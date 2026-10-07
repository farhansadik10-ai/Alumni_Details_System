import { useAtomValue } from "jotai";
import { Suspense } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { To } from "react-router-dom";
import { isExpired } from "../lib/token";
import { sessionAtom } from "../store/sessionAtoms";
import { PATHS } from "./paths";

/**
 * The address RequireAuth handed over, or null. Router state can be anything,
 * so every part is checked. Only an address inside the app is accepted.
 */
function readReturnAddress(state: unknown): To | null {
  if (typeof state !== "object" || state === null) {
    return null;
  }
  const from: unknown = (state as { from?: unknown }).from;
  if (typeof from !== "object" || from === null) {
    return null;
  }
  const { pathname, search, hash } = from as Record<string, unknown>;
  if (typeof pathname !== "string" || !pathname.startsWith("/") || pathname.startsWith("//")) {
    return null;
  }
  return {
    pathname,
    search: typeof search === "string" ? search : "",
    hash: typeof hash === "string" ? hash : "",
  };
}

/**
 * Log in and sign-up are for visitors. A logged-in user is sent on: to the
 * page they first asked for, else to the Dashboard. This is the only code
 * that navigates after a log in; the pages themselves never do.
 */
export function PublicOnly() {
  const session = useAtomValue(sessionAtom);
  const location = useLocation();

  // An expired session is not a session: RequireAuth would send it straight back.
  const isLive = session !== null && !isExpired(session, Date.now());

  if (isLive) {
    return <Navigate to={readReturnAddress(location.state) ?? PATHS.dashboard} replace />;
  }

  return (
    <Suspense fallback={<p className="visuallyHidden">Loading</p>}>
      <Outlet />
    </Suspense>
  );
}
