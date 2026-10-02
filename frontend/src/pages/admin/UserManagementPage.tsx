import { Card } from "antd";
import EmptyState from "../../components/common/EmptyState";
import PageHeader from "../../components/common/PageHeader";

// Placeholder: the user list, email search and delete are built in bolt B6. Admin only (RequireRole in App.tsx).
export default function UserManagementPage() {
  return (
    <>
      <PageHeader title="User Management" subtitle="All registered users" />
      <Card>
        <EmptyState description="User Management is built in bolt B6." />
      </Card>
    </>
  );
}
