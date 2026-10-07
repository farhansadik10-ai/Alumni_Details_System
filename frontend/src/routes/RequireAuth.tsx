import { useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isExpired } from "../lib/token";
import { endSessionAtom } from "../store/sessionActions";
import { authNoticeAtom, sessionAtom, tokenAtom } from "../store/sessionAtoms";
import { PATHS } from "./paths";

/**
 * The logged-in guard. With no live session it sends the visitor to log in
 * and hands over the address they asked for (`state.from`), so PublicOnly can
 * bring them back after the log in. After a log out there is no return
 * address: the next log in lands on the Dashboard.
 */
export function RequireAuth() {
  const token = useAtomValue(tokenAtom);
  const session = useAtomValue(sessionAtom);
  const notice = useAtomValue(authNoticeAtom);
  const endSession = useSetAtom(endSessionAtom);
  const location = useLocation();

  // The session atom has no clock, so the expiry is judged here, on each render.
  const isLive = session !== null && !isExpired(session, Date.now());
  // A token is still stored, but it has run out or cannot be read.
  const isDeadSession = token !== null && !isLive;

  // Never during render: ending the session writes the store.
  useEffect(() => {
    if (isDeadSession) {
      endSession();
    }
  }, [isDeadSession, endSession]);

  if (!isLive) {
    const state = notice === "loggedOut" ? null : { from: location };
    return <Navigate to={PATHS.login} replace state={state} />;
  }

  return <Outlet />;
}
