import { Button } from "../Button/Button";
import styles from "./ErrorState.module.css";

const RETRY_LABEL = "Try again";

export type ErrorStateProps = {
  heading: string;
  // One line: "Check your connection and try again."
  text: string;
  // The heading element. It always looks the same (H3 size).
  headingAs?: "h2" | "h3";
  onRetry: () => void;
  // Pass "secondary" on a page that already has a primary button (one per view).
  retryVariant?: "primary" | "secondary";
};

export function ErrorState({
  heading,
  text,
  headingAs: Heading = "h2",
  onRetry,
  retryVariant = "primary",
}: ErrorStateProps) {
  return (
    <div className={styles.error} role="alert">
      <Heading className={styles.heading}>{heading}</Heading>
      <p className={styles.text}>{text}</p>
      <div className={styles.action}>
        <Button variant={retryVariant} onClick={onRetry}>
          {RETRY_LABEL}
        </Button>
      </div>
    </div>
  );
}
