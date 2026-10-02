import { Button, Card } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import Can from "../../components/common/Can";
import EmptyState from "../../components/common/EmptyState";
import PageHeader from "../../components/common/PageHeader";
import { ROLES } from "../../constants/roles";

// Placeholder: the posts feed is built in bolt B5. The disabled "New post" button
// already uses Can, so its role check (alumni, admin) can be tested now.
export default function PostsFeedPage() {
  return (
    <>
      <PageHeader
        title="Posts"
        subtitle="News and updates from alumni"
        extra={
          <Can roles={[ROLES.ALUMNI, ROLES.ADMIN]}>
            <Button type="primary" icon={<PlusOutlined />} disabled>
              New post
            </Button>
          </Can>
        }
      />
      <Card>
        <EmptyState description="The posts feed is built in bolt B5." />
      </Card>
    </>
  );
}
