import { Button, Dropdown, Flex, Typography } from "antd";
import type { MenuProps } from "antd";
import { LogoutOutlined, UserOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { ROLE_LABELS } from "../../constants/roles";
import useCurrentUser from "../../hooks/useCurrentUser";
import useIsMobile from "../../hooks/useIsMobile";
import useLogout from "../../hooks/useLogout";
import { PATHS } from "../../routes/paths";
import RoleTag from "../common/RoleTag";
import UserAvatar from "../common/UserAvatar";

// Avatar + name in the header; the dropdown has My Profile and Log out.
// Id and role come from the token; name, email and photo from GET /api/users/:id.
export default function HeaderUserMenu() {
  const { user, profile } = useCurrentUser();
  const { logout, loggingOut } = useLogout();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  if (!user) return null;

  // Until the profile has loaded (or if it fails), show the role instead of a name.
  const name = profile?.name || ROLE_LABELS[user.role];

  const items: MenuProps["items"] = [
    {
      key: "account",
      type: "group",
      label: (
        <Flex vertical gap={4}>
          <Typography.Text strong>{name}</Typography.Text>
          {profile?.email && <Typography.Text type="secondary">{profile.email}</Typography.Text>}
          <span>
            <RoleTag role={user.role} />
          </span>
        </Flex>
      ),
    },
    { type: "divider" },
    { key: "profile", icon: <UserOutlined />, label: "My Profile" },
    { key: "logout", icon: <LogoutOutlined />, label: "Log out", danger: true, disabled: loggingOut },
  ];

  const handleClick: MenuProps["onClick"] = ({ key }) => {
    if (key === "profile") navigate(PATHS.PROFILE);
    if (key === "logout") void logout();
  };

  return (
    <Dropdown menu={{ items, onClick: handleClick }} trigger={["click"]} placement="bottomRight">
      <Button type="text" aria-label="Account menu" loading={loggingOut} style={{ height: "auto", paddingBlock: 4 }}>
        <Flex align="center" gap="small" style={{ maxWidth: isMobile ? undefined : 260 }}>
          <UserAvatar name={name} photoUrl={profile?.photo_url || undefined} showName={!isMobile} />
          {!isMobile && <RoleTag role={user.role} />}
        </Flex>
      </Button>
    </Dropdown>
  );
}
