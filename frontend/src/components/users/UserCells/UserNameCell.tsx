import { memo } from "react";
import { USERS_YOU_TAG } from "../../../config/text";
import { displayName } from "../../../lib/alumniDisplay";
import { Avatar } from "../../ui/Avatar/Avatar";
import { Tag } from "../../ui/Tag/Tag";
import styles from "./UserNameCell.module.css";

export type UserNameCellProps = {
  name: string | null;
  photoUrl: string | null;
  // The logged-in admin's own row: the "You" tag (AC5).
  isSelf: boolean;
};

/**
 * The Name cell of the Users table: avatar, name, and "You" on the admin's own row.
 *
 * memo: Table calls its render functions on every draw of the page (typing in
 * the search box, opening the delete dialog); this cell's props are plain
 * values, so an unchanged row skips its avatar and name (AC26, performance.md).
 */
export const UserNameCell = memo(function UserNameCell({
  name,
  photoUrl,
  isSelf,
}: UserNameCellProps) {
  return (
    <div className={styles.cell}>
      <span className={styles.person}>
        <Avatar name={name} photoUrl={photoUrl} size="sm" />
        <span className={styles.name}>{displayName(name)}</span>
      </span>
      {isSelf ? <Tag>{USERS_YOU_TAG}</Tag> : null}
    </div>
  );
});
