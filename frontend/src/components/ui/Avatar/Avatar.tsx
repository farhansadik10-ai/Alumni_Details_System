import { useState } from "react";
import { initialsOf } from "../../../lib/initials";
import { isWebLink } from "../../../lib/validation";
import styles from "./Avatar.module.css";

export type AvatarSize = "sm" | "md" | "lg";

export type AvatarProps = {
  name: string | null;
  // Shown only when it starts with http:// or https://.
  photoUrl?: string | null;
  size?: AvatarSize;
};

/**
 * Decorative: the person's name is always written beside it, so the avatar is
 * hidden from screen readers and the photo has an empty alt.
 */
export function Avatar({ name, photoUrl, size = "md" }: AvatarProps) {
  // The link that failed to load, not a yes / no: a new link gets its own try.
  const [failedLink, setFailedLink] = useState<string | null>(null);

  const link = (photoUrl ?? "").trim();
  const showPhoto = isWebLink(link) && link !== failedLink;

  return (
    <span className={`${styles.avatar} ${styles[size]}`} aria-hidden="true">
      {showPhoto ? (
        <img
          className={styles.photo}
          src={link}
          alt=""
          // The photo host does not learn which page was open.
          referrerPolicy="no-referrer"
          loading="lazy"
          // Also covers an http:// photo that the browser blocks on an https:// site.
          onError={() => setFailedLink(link)}
        />
      ) : (
        initialsOf(name)
      )}
    </span>
  );
}
