import { presentText } from "../../../lib/alumniDisplay";
import styles from "./PostText.module.css";

export type PostTextProps = {
  // The caption or comment as stored. Nothing is drawn when it has no visible character.
  text: string | null;
  // "md" for a post, "sm" for a comment.
  size?: "sm" | "md";
  // Cut to three lines with an ellipsis, for a summary card. The full text is
  // where the summary leads.
  clamp?: boolean;
};

/**
 * The words of a post or a comment, as plain text: React escapes it, line
 * breaks are kept, and a long word or link wraps instead of widening the card.
 */
export function PostText({ text, size = "md", clamp = false }: PostTextProps) {
  const shown = presentText(text);
  if (shown === null) {
    return null;
  }

  const className = [styles.text, styles[size], clamp ? styles.clamp : ""]
    .filter(Boolean)
    .join(" ");

  return <p className={className}>{shown}</p>;
}
