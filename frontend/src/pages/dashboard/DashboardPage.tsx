import { Card } from "antd";
import EmptyState from "../../components/common/EmptyState";
import PageHeader from "../../components/common/PageHeader";

// Placeholder: stat cards and recent posts come in bolt B6.
export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" subtitle="Welcome to the Alumni Details System" />
      <Card>
        <EmptyState description="Stat cards and recent posts are built in bolt B6." />
      </Card>
    </>
  );
}
