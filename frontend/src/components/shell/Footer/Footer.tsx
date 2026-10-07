import { APP_NAME } from "../../../config/app";
import styles from "./Footer.module.css";

/** The page footer: the app name. The About link arrives with the About page (ADR-10). */
export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>{APP_NAME}</div>
    </footer>
  );
}
