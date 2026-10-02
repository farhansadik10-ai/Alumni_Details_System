import { Card } from "antd";
import EmptyState from "../../components/common/EmptyState";
import PageHeader from "../../components/common/PageHeader";

// Placeholder: viewing and editing your profile is built in bolt B10.
export default function ProfilePage() {
  return (
    <>
      <PageHeader title="My Profile" subtitle="Your name, email, photo and password" />
      <Card>
        <EmptyState description="My Profile is built in bolt B10." />
      </Card>
    </>
  );
}
