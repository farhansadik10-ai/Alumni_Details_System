import { Empty } from "antd";
import type { ReactNode } from "react";

export interface EmptyStateProps {
  description: string;
  action?: ReactNode;
}

export default function EmptyState({ description, action }: EmptyStateProps) {
  return (
    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={description}>
      {action}
    </Empty>
  );
}
