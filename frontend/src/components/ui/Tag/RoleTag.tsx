import { ROLE_WORDS } from "../../../config/text";
import { asRole } from "../../../lib/token";
import type { Role } from "../../../lib/token";
import { Tag } from "./Tag";
import type { TagVariant } from "./Tag";

// The colour of each role. The word comes from ROLE_WORDS (one copy, shared
// with the Users role filter).
const ROLE_VARIANTS: Record<Role, TagVariant> = {
  student: "role-student",
  alumni: "role-alumni",
  admin: "role-admin",
};

export type RoleTagProps = {
  // The role as the API gives it. A role we do not know renders nothing.
  role: string | null | undefined;
};

export function RoleTag({ role }: RoleTagProps) {
  const known = role ? asRole(role) : null;
  if (known === null) {
    return null;
  }
  return <Tag variant={ROLE_VARIANTS[known]}>{ROLE_WORDS[known]}</Tag>;
}
