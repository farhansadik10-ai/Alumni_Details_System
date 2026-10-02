import { Flex, Spin, Typography } from "antd";

export interface LoadingStateProps {
  tip?: string;
}

export default function LoadingState({ tip }: LoadingStateProps) {
  return (
    <Flex vertical align="center" justify="center" gap="small" style={{ paddingBlock: 48 }}>
      <Spin size="large" />
      {tip && <Typography.Text type="secondary">{tip}</Typography.Text>}
    </Flex>
  );
}
