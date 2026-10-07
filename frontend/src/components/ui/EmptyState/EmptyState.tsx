import { Button } from "../Button/Button";
import styles from "./EmptyState.module.css";

export type EmptyStateProps = {
  heading: string;
  // One line that says what to do next: "Try a different name, or clear the filters."
  text: string;
  // The heading element. It always looks the same (H3 size).
  headingAs?: "h2" | "h3";
  // Give both to show the button.
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  heading,
  text,
  headingAs: Heading = "h2",
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      <Heading className={styles.heading}>{heading}</Heading>
      <p className={styles.text}>{text}</p>
      {actionLabel && onAction ? (
        <div className={styles.action}>
          <Button variant="secondary" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
