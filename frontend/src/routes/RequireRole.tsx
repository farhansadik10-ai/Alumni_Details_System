import type { ReactNode } from "react";
import { useAtomValue } from "jotai";
import type { Role } from "../constants/roles";
import ForbiddenPage from "../pages/errors/ForbiddenPage";
import { currentUserAtom } from "../store/authAtom";

export interface RequireRoleProps {
  roles: Role[];
  children: ReactNode;
}

// Used inside RequireAuth, which already handles a missing or expired token.
// This only hides the screen; the backend must still enforce the role.
export default function RequireRole({ roles, children }: RequireRoleProps) {
  const user = useAtomValue(currentUserAtom);

  if (!user || !roles.includes(user.role)) return <ForbiddenPage />;

  return <>{children}</>;
}
