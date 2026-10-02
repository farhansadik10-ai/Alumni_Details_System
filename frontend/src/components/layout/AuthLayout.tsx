import { Card, Flex, Typography, theme } from "antd";
import type { ReactNode } from "react";

export interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

// Centered card for the public screens (Login, Sign Up); full width on phones.
export default function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  const { token } = theme.useToken();

  return (
    <Flex
      justify="center"
      align="center"
      style={{ minHeight: "100vh", padding: token.padding, background: token.colorBgLayout }}
    >
      <Card style={{ width: 420, maxWidth: "100%", boxShadow: token.boxShadowTertiary }}>
        <Flex vertical align="center" style={{ marginBottom: token.marginLG, textAlign: "center" }}>
          <Typography.Title level={2} style={{ marginBottom: token.marginXXS }}>
            {title}
          </Typography.Title>
          {subtitle && <Typography.Text type="secondary">{subtitle}</Typography.Text>}
        </Flex>
        {children}
      </Card>
    </Flex>
  );
}
