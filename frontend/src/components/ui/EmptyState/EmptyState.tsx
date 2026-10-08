import { Button } from "../Button/Button";
import { ButtonLink } from "../ButtonLink/ButtonLink";
import styles from "./EmptyState.module.css";

export type EmptyStateProps = {
  heading: string;
  // One line that says what to do next: "Try a different name, or clear the filters."
  text: string;
  // The heading element. It always looks the same (H3 size).
  headingAs?: "h2" | "h3";
  // Give actionLabel and onAction to show a button, or actionLabel and
  // actionTo to show a link to another page. actionTo wins if both are given.
  actionLabel?: string;
  onAction?: () => void;
  actionTo?: string;
};

export function EmptyState({
  heading,
  text,
  headingAs: Heading = "h2",
  actionLabel,
  onAction,
  actionTo,
}: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      <Heading className={styles.heading}>{heading}</Heading>
      <p className={styles.text}>{text}</p>
      {actionLabel && actionTo ? (
        <div className={styles.action}>
          <ButtonLink to={actionTo} variant="secondary">
            {actionLabel}
          </ButtonLink>
        </div>
      ) : actionLabel && onAction ? (
        <div className={styles.action}>
          <Button variant="secondary" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
