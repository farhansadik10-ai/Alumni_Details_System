import { useAtomValue } from "jotai";
import { Suspense } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { LOADING_TEXT } from "../config/text";
import { readReturnAddress } from "../lib/returnAddress";
import { isLiveSession } from "../lib/token";
import { sessionAtom } from "../store/sessionAtoms";
import { AFTER_LOG_IN_STATE, PATHS } from "./paths";

/**
 * Log in and sign-up are for visitors. A logged-in user is sent on: to the
 * page they first asked for, else to the Dashboard. This is the only code
 * that navigates after a log in; the pages themselves never do.
 */
export function PublicOnly() {
  const session = useAtomValue(sessionAtom);
  const location = useLocation();

  // An expired session is not a session: RequireAuth would send it straight back.
  if (isLiveSession(session, Date.now())) {
    return (
      <Navigate
        to={readReturnAddress(location.state) ?? PATHS.dashboard}
        replace
        state={AFTER_LOG_IN_STATE}
      />
    );
  }

  return (
    <Suspense fallback={<p className="visuallyHidden">{LOADING_TEXT}</p>}>
      <Outlet />
    </Suspense>
  );
}
