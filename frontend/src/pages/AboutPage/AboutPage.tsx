import { useId } from "react";
import { APP_NAME, CONTACT_EMAIL } from "../../config/app";
import {
  ABOUT_CONTACT_HEADING,
  ABOUT_CONTACT_TEXT,
  ABOUT_HEADING,
  ABOUT_PURPOSE_HEADING,
  ABOUT_USE_HEADING,
  ABOUT_USE_TEXT,
  aboutPurposeText,
  aboutSub,
} from "../../config/text";
import { PageLayout } from "../../components/shell/PageLayout/PageLayout";
import { Card } from "../../components/ui/Card/Card";
import { Link } from "../../components/ui/Link/Link";
import { mailtoHref } from "../../lib/mailtoLink";
import styles from "./AboutPage.module.css";

// The About page (AC13 to AC16, ADR-10). Logged-in users only: it sits inside
// RequireAuth and AppShell (spec A5). All words come from config/text.ts; the
// app name and the contact email come from config/app.ts. No fact about any
// school.
export default function AboutPage() {
  const purposeId = useId();
  const useHeadingId = useId();
  const contactId = useId();
  // The placeholder address is a plain one, so this is a link; if the owner
  // ever sets something that is not a plain address, it shows as text.
  const contactHref = mailtoHref(CONTACT_EMAIL);

  return (
    <PageLayout heading={ABOUT_HEADING} sub={aboutSub(APP_NAME)}>
      <Card padding="lg">
        <div className={styles.sections}>
          <section aria-labelledby={purposeId} className={styles.section}>
            <h2 id={purposeId} className={styles.heading}>
              {ABOUT_PURPOSE_HEADING}
            </h2>
            <p className={styles.text}>{aboutPurposeText(APP_NAME)}</p>
          </section>
          <section aria-labelledby={useHeadingId} className={styles.section}>
            <h2 id={useHeadingId} className={styles.heading}>
              {ABOUT_USE_HEADING}
            </h2>
            <p className={styles.text}>{ABOUT_USE_TEXT}</p>
          </section>
        </div>
      </Card>

      <Card as="section" padding="lg" aria-labelledby={contactId}>
        <div className={styles.section}>
          <h2 id={contactId} className={styles.heading}>
            {ABOUT_CONTACT_HEADING}
          </h2>
          <p className={styles.text}>
            {ABOUT_CONTACT_TEXT}{" "}
            <span className={styles.email}>
              {contactHref !== null ? (
                <Link href={contactHref}>{CONTACT_EMAIL}</Link>
              ) : (
                CONTACT_EMAIL
              )}
            </span>
            .
          </p>
        </div>
      </Card>
    </PageLayout>
  );
}
