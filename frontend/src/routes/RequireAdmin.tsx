import { useAtomValue } from "jotai";
import { lazy } from "react";
import { Outlet } from "react-router-dom";
import { isAdmin } from "../lib/token";
import { sessionAtom } from "../store/sessionAtoms";

const NoAccessPage = lazy(() => import("../pages/NoAccessPage/NoAccessPage"));

/**
 * The admin guard. Anyone else sees the no-access page inside the shell; the
 * admin page is never rendered for them, so it sends no request.
 * It sits inside RequireAuth and the shell, which supply the session and the
 * Suspense for the lazy page.
 */
export function RequireAdmin() {
  const session = useAtomValue(sessionAtom);

  if (!isAdmin(session)) {
    return <NoAccessPage />;
  }

  return <Outlet />;
}
