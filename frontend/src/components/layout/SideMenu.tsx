import { Flex, Menu, Typography, theme } from "antd";
import type { MenuProps } from "antd";
import { DashboardOutlined, FileTextOutlined, ReadOutlined, SafetyOutlined, TeamOutlined, UserOutlined } from "@ant-design/icons";
import { useAtomValue } from "jotai";
import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ALL_ROLES, ROLES } from "../../constants/roles";
import type { Role } from "../../constants/roles";
import { PATHS } from "../../routes/paths";
import { currentUserAtom } from "../../store/authAtom";

export interface SideMenuProps {
  // Icon-only menu (the Sider is collapsed): the app name is hidden too.
  collapsed: boolean;
  // Called after a menu item is chosen, e.g. to close the mobile Drawer.
  onNavigate?: () => void;
}

interface MenuEntry {
  path: string;
  label: string;
  icon: ReactNode;
  roles: Role[];
}

// Same access as "Screens by role" in AIdlc/plan.md.
const MENU: MenuEntry[] = [
  { path: PATHS.DASHBOARD, label: "Dashboard", icon: <DashboardOutlined />, roles: ALL_ROLES },
  { path: PATHS.POSTS, label: "Posts", icon: <FileTextOutlined />, roles: ALL_ROLES },
  { path: PATHS.ALUMNI, label: "Alumni", icon: <TeamOutlined />, roles: ALL_ROLES },
  { path: PATHS.PROFILE, label: "My Profile", icon: <UserOutlined />, roles: ALL_ROLES },
  { path: PATHS.ADMIN_USERS, label: "User Management", icon: <SafetyOutlined />, roles: [ROLES.ADMIN] },
];

// The menu entry for the current URL, including sub-pages (/alumni/5 → Alumni).
function selectedPath(pathname: string): string | undefined {
  return MENU.find((entry) => pathname === entry.path || pathname.startsWith(`${entry.path}/`))?.path;
}

export default function SideMenu({ collapsed, onNavigate }: SideMenuProps) {
  const { token } = theme.useToken();
  const user = useAtomValue(currentUserAtom);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const items: MenuProps["items"] = MENU.filter((entry) => user && entry.roles.includes(user.role)).map(
    (entry) => ({ key: entry.path, icon: entry.icon, label: entry.label })
  );
  const selected = selectedPath(pathname);

  const handleClick: MenuProps["onClick"] = ({ key }) => {
    navigate(key);
    onNavigate?.();
  };

  return (
    <Flex vertical>
      <Flex
        align="center"
        justify={collapsed ? "center" : "flex-start"}
        gap="small"
        style={{
          minHeight: token.controlHeightLG + token.paddingLG,
          paddingInline: token.paddingLG,
          paddingBlock: token.paddingXS,
        }}
      >
        <ReadOutlined style={{ fontSize: token.fontSizeXL, color: token.colorPrimary, flexShrink: 0 }} />
        {/* The full name, wrapping to a second line if needed; never truncated. */}
        {!collapsed && (
          <Typography.Text strong style={{ minWidth: 0, lineHeight: token.lineHeightSM }}>
            Alumni Details System
          </Typography.Text>
        )}
      </Flex>
      <Menu
        mode="inline"
        items={items}
        selectedKeys={selected ? [selected] : []}
        onClick={handleClick}
        style={{ borderInlineEnd: 0 }}
      />
    </Flex>
  );
}
