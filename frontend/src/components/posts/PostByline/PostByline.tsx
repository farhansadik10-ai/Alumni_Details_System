import type { ReactNode } from "react";
import { Avatar } from "../../ui/Avatar/Avatar";
import { displayName } from "../../../lib/alumniDisplay";
import { dateText } from "../../../lib/postDisplay";
import styles from "./PostByline.module.css";

export type PostBylineSize = "sm" | "md";

export type PostBylineProps = {
  // The author's name from the post or comment; "Name not given" when empty.
  name: string | null;
  photoUrl?: string | null;
  // The ISO created_at text. No date is shown when it is missing or unreadable.
  createdAt: string | null;
  // "md" for a post (name over the date), "sm" for a comment (one row).
  size?: PostBylineSize;
  // Drawn under the name, beside the avatar: a comment's text and its
  // buttons, as feed.html draws them.
  children?: ReactNode;
};

/**
 * Who wrote a post or a comment, and when. The name is plain text: the post
 * answer carries no profile id, so it cannot be a link (spec).
 */
export function PostByline({ name, photoUrl, createdAt, size = "md", children }: PostBylineProps) {
  const date = dateText(createdAt);

  return (
    <div className={`${styles.byline} ${styles[size]}`}>
      <Avatar name={name} photoUrl={photoUrl} size={size} />
      <div className={styles.body}>
        <div className={styles.meta}>
          <span className={styles.name}>{displayName(name)}</span>
          {date !== null && createdAt !== null ? (
            <time className={styles.date} dateTime={createdAt}>
              {date}
            </time>
          ) : null}
        </div>
        {children}
      </div>
    </div>
  );
}
