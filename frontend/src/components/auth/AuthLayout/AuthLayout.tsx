import type { ReactNode } from "react";
import { APP_NAME } from "../../../config/app";
import { ThemeSwitch } from "../../shell/ThemeSwitch/ThemeSwitch";
import styles from "./AuthLayout.module.css";

const AUDIENCE_LINE = "For students, alumni and university staff.";

export type AuthLayoutProps = {
  /** The large line on the band panel. Not a heading: the form title is the page's <h1>. */
  headline: string;
  /** One or two sentences under the headline. */
  sub: string;
  /** The form. */
  children: ReactNode;
};

/**
 * The frame of log in and sign-up (login.html, signup.html): the band panel
 * beside the form. The two columns wrap, so on a narrow screen the panel sits
 * above the form without a breakpoint.
 */
export function AuthLayout({ headline, sub, children }: AuthLayoutProps) {
  return (
    <div className={styles.page}>
      <section className={styles.band}>
        <p className={styles.appName}>{APP_NAME}</p>
        <div className={styles.pitch}>
          <div className={styles.bar} aria-hidden="true" />
          <p className={styles.headline}>{headline}</p>
          <p className={styles.sub}>{sub}</p>
        </div>
        <p className={styles.audience}>{AUDIENCE_LINE}</p>
      </section>

      <main className={styles.main}>
        <div className={styles.theme}>
          <ThemeSwitch variant="icons" />
        </div>
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}
