import { Tag } from "antd";
import { ROLE_LABELS } from "../../constants/roles";
import type { Role } from "../../constants/roles";
import roleColors from "../../theme/roleColors";

export interface RoleTagProps {
  role: Role;
}

export default function RoleTag({ role }: RoleTagProps) {
  return <Tag color={roleColors[role]}>{ROLE_LABELS[role]}</Tag>;
}
