import type { Role } from "../../../lib/token";
import { Tag } from "./Tag";
import type { TagVariant } from "./Tag";

const ROLE_TAGS: Record<Role, { variant: TagVariant; word: string }> = {
  student: { variant: "role-student", word: "Student" },
  alumni: { variant: "role-alumni", word: "Alumni" },
  admin: { variant: "role-admin", word: "Admin" },
};

function isRole(value: string): value is Role {
  return Object.hasOwn(ROLE_TAGS, value);
}

export type RoleTagProps = {
  // The role as the API gives it. A role we do not know renders nothing.
  role: string | null | undefined;
};

export function RoleTag({ role }: RoleTagProps) {
  if (!role || !isRole(role)) {
    return null;
  }
  const { variant, word } = ROLE_TAGS[role];
  return <Tag variant={variant}>{word}</Tag>;
}
