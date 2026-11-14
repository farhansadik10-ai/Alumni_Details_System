import { useState } from "react";
import { initialsOf } from "../../../lib/initials";
import { isWebLink } from "../../../lib/validation";
import styles from "./Avatar.module.css";

// "xl" is the profile band (120px, 96px on a phone).
export type AvatarSize = "sm" | "md" | "lg" | "xl";

// The photo's width and height attributes say only its shape, a square, so
// the browser knows it before the photo arrives. The stylesheet fills the
// token-sized box (width and height 100%), which wins over the attributes.
const SQUARE_HINT = 1;

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
          width={SQUARE_HINT}
          height={SQUARE_HINT}
          // The photo host does not learn which page was open.
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
          // Also covers an http:// photo that the browser blocks on an https:// site.
          onError={() => setFailedLink(link)}
        />
      ) : (
        initialsOf(name)
      )}
    </span>
  );
}
