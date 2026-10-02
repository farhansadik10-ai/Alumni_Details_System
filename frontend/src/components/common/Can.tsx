import { useAtomValue } from "jotai";
import type { ReactNode } from "react";
import { ROLES } from "../../constants/roles";
import type { Role } from "../../constants/roles";
import { currentUserAtom } from "../../store/authAtom";
import { isExpired } from "../../utils/jwt";

export interface CanProps {
  // Only these roles see the children.
  roles?: Role[];
  // Only this user sees the children (e.g. the author of a post).
  ownerId?: number;
  // An admin sees the children regardless of `roles` and `ownerId`.
  allowAdmin?: boolean;
  children: ReactNode;
  fallback?: ReactNode;
}

// Shows or hides UI by the logged-in user's role and id, read from the token (no API call).
// With no `roles` and no `ownerId`, any logged-in user sees the children.
// This only hides UI; the backend must still enforce access.
export default function Can({ roles, ownerId, allowAdmin = false, children, fallback = null }: CanProps) {
  const user = useAtomValue(currentUserAtom);

  let allowed = user !== null && !isExpired(user);
  if (user && allowed && !(allowAdmin && user.role === ROLES.ADMIN)) {
    if (roles && !roles.includes(user.role)) allowed = false;
    if (ownerId !== undefined && user.id !== ownerId) allowed = false;
  }

  return <>{allowed ? children : fallback}</>;
}
