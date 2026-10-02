import { Card } from "antd";
import { Link, useParams } from "react-router-dom";
import EmptyState from "../../components/common/EmptyState";
import PageHeader from "../../components/common/PageHeader";
import { PATHS } from "../../routes/paths";

// Placeholder: the alumni detail screen is built in bolt B12.
export default function AlumniDetailPage() {
  const { id } = useParams();

  return (
    <>
      <PageHeader
        title="Alumni profile"
        breadcrumb={[{ title: <Link to={PATHS.ALUMNI}>Alumni</Link> }, { title: `#${id}` }]}
      />
      <Card>
        <EmptyState description="The alumni detail screen is built in bolt B12." />
      </Card>
    </>
  );
}
