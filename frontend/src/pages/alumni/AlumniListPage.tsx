import { Button, Card } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import Can from "../../components/common/Can";
import EmptyState from "../../components/common/EmptyState";
import PageHeader from "../../components/common/PageHeader";
import { ROLES } from "../../constants/roles";

// Placeholder: the alumni directory is built in bolt B12. The disabled "Add my alumni profile"
// button already uses Can, so its role check (alumni, admin) can be tested now.
export default function AlumniListPage() {
  return (
    <>
      <PageHeader
        title="Alumni"
        subtitle="Find graduates by name, department or year"
        extra={
          <Can roles={[ROLES.ALUMNI, ROLES.ADMIN]}>
            <Button type="primary" icon={<PlusOutlined />} disabled>
              Add my alumni profile
            </Button>
          </Can>
        }
      />
      <Card>
        <EmptyState description="The alumni directory is built in bolt B12." />
      </Card>
    </>
  );
}
