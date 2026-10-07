import { PageLayout, PageNote } from "../../components/shell/PageLayout/PageLayout";
import { Link } from "../../components/ui/Link/Link";
import { PATHS } from "../../routes/paths";

// What a user who is not an admin sees at the Users address (AC39). The
// RequireAdmin guard renders it in place of the page; no request is sent.
export default function NoAccessPage() {
  return (
    <PageLayout heading="Users">
      <PageNote title="You do not have access to this page">
        <Link to={PATHS.dashboard}>Go to the Dashboard</Link>
      </PageNote>
    </PageLayout>
  );
}
