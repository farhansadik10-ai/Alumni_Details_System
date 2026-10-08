import { ROLE_WORDS } from "../../../config/text";
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

function isRole(value: string): value is Role {
  return Object.hasOwn(ROLE_VARIANTS, value);
}

export type RoleTagProps = {
  // The role as the API gives it. A role we do not know renders nothing.
  role: string | null | undefined;
};

export function RoleTag({ role }: RoleTagProps) {
  if (!role || !isRole(role)) {
    return null;
  }
  return <Tag variant={ROLE_VARIANTS[role]}>{ROLE_WORDS[role]}</Tag>;
}
