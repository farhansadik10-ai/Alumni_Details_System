import type { Role } from "../constants/roles";

// Ant Design preset tag colors, so they follow the theme instead of hard-coded hex values.
const roleColors: Record<Role, string> = {
  student: "geekblue",
  alumni: "green",
  admin: "volcano",
};

export default roleColors;
