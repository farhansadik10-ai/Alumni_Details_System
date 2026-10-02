import { Breadcrumb, Flex, Typography } from "antd";
import type { BreadcrumbProps } from "antd";
import type { ReactNode } from "react";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumb?: BreadcrumbProps["items"];
  extra?: ReactNode;
}

export default function PageHeader({ title, subtitle, breadcrumb, extra }: PageHeaderProps) {
  return (
    <Flex vertical gap="small" style={{ marginBottom: 24 }}>
      {breadcrumb && breadcrumb.length > 0 && <Breadcrumb items={breadcrumb} />}
      <Flex justify="space-between" align="flex-start" wrap gap="middle">
        {/* minWidth 0 lets a long title wrap instead of widening the page. */}
        <Flex vertical style={{ minWidth: 0, flex: "1 1 240px" }}>
          <Typography.Title level={3} style={{ margin: 0, overflowWrap: "anywhere" }}>
            {title}
          </Typography.Title>
          {subtitle && <Typography.Text type="secondary">{subtitle}</Typography.Text>}
        </Flex>
        {extra && (
          <Flex wrap gap="small">
            {extra}
          </Flex>
        )}
      </Flex>
    </Flex>
  );
}
