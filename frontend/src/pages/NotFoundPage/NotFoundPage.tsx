import { PageLayout, PageNote } from "../../components/shell/PageLayout/PageLayout";
import { Link } from "../../components/ui/Link/Link";
import { PATHS } from "../../routes/paths";

// An address that matches no page (AC40). Shown inside the shell.
export default function NotFoundPage() {
  return (
    <PageLayout heading="Page not found">
      <PageNote title="There is no page at this address">
        <Link to={PATHS.dashboard}>Go to the Dashboard</Link>
      </PageNote>
    </PageLayout>
  );
}
