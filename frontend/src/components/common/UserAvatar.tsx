import { Avatar, Flex, Typography, theme } from "antd";
import type { AvatarProps } from "antd";
import { UserOutlined } from "@ant-design/icons";

export interface UserAvatarProps {
  name: string;
  photoUrl?: string;
  size?: AvatarProps["size"];
  showName?: boolean;
}

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : "";
  return (first + last).toUpperCase();
}

// Shows the photo; with no photo, or one that fails to load, antd falls back to the initials.
export default function UserAvatar({ name, photoUrl, size, showName = false }: UserAvatarProps) {
  const { token } = theme.useToken();
  const text = initials(name);

  const avatar = (
    <Avatar
      size={size}
      src={photoUrl || undefined}
      alt={name}
      icon={text ? undefined : <UserOutlined />}
      style={{ backgroundColor: token.colorPrimary, flexShrink: 0 }}
    >
      {text}
    </Avatar>
  );

  if (!showName) return avatar;

  return (
    <Flex align="center" gap="small" style={{ minWidth: 0 }}>
      {avatar}
      <Typography.Text ellipsis={{ tooltip: name }}>{name}</Typography.Text>
    </Flex>
  );
}
