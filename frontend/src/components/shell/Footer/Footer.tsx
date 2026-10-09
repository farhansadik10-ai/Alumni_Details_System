import { APP_NAME } from "../../../config/app";
import { FOOTER_ABOUT_LINK } from "../../../config/text";
import { PATHS } from "../../../routes/paths";
import { Link } from "../../ui/Link/Link";
import styles from "./Footer.module.css";

/** The page footer: the app name on the left, the About link on the right (ADR-10). */
export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <span>{APP_NAME}</span>
        <Link to={PATHS.about}>{FOOTER_ABOUT_LINK}</Link>
      </div>
    </footer>
  );
}
