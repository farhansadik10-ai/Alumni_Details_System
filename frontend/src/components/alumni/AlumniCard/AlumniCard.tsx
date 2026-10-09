import { memo, useId } from "react";
import type { Alumni } from "@alumni/shared";
import {
  DIRECTORY_VIEW_PROFILE,
  OPEN_TO_MENTORING,
  directoryViewProfileName,
} from "../../../config/text";
import { classLabel, displayName, jobLine, presentText } from "../../../lib/alumniDisplay";
import { directoryReturnState } from "../../../lib/directoryReturn";
import { alumniProfilePath } from "../../../routes/paths";
import { Avatar } from "../../ui/Avatar/Avatar";
import { Card } from "../../ui/Card/Card";
import { Link } from "../../ui/Link/Link";
import { Tag } from "../../ui/Tag/Tag";
import styles from "./AlumniCard.module.css";

export type AlumniCardProps = {
  alumni: Alumni;
  /**
   * The directory's query string ("?q=ab&page=2"), so "Back to directory" on
   * the profile returns to the same filters (AC17).
   */
  directorySearch: string;
};

/**
 * One result of the directory (directory.html, AC2). The card is not one big
 * link: "View profile" is the link, and its accessible name has the name.
 *
 * memo: typing in the search box draws the page on every letter; the cards,
 * whose props have not changed, are skipped (AC26, performance.md).
 */
export const AlumniCard = memo(function AlumniCard({ alumni, directorySearch }: AlumniCardProps) {
  const nameId = useId();
  const name = displayName(alumni.name);
  const job = jobLine(alumni.job_title, alumni.current_company);
  // Keyed by kind: a department and a field can have the same words. An
  // empty tag is left out (AC2).
  const tags = [
    { kind: "department", text: presentText(alumni.department) },
    { kind: "class", text: classLabel(alumni.graduation_year) },
    { kind: "field", text: presentText(alumni.field) },
  ].filter((tag): tag is { kind: string; text: string } => tag.text !== null);
  // directoryViewProfileName starts with the visible words; the rest is read out only.
  const hiddenNamePart = directoryViewProfileName(name).slice(DIRECTORY_VIEW_PROFILE.length);

  return (
    <Card as="article" aria-labelledby={nameId}>
      <div className={styles.body}>
        <div className={styles.top}>
          <Avatar name={alumni.name} photoUrl={alumni.photo_url} size="md" />
          {alumni.mentorship_available ? <Tag variant="mentoring">{OPEN_TO_MENTORING}</Tag> : null}
        </div>
        <div className={styles.who}>
          <h2 id={nameId} className={styles.name}>
            {name}
          </h2>
          {job !== null ? <p className={styles.job}>{job}</p> : null}
        </div>
        {tags.length > 0 ? (
          <ul className={styles.tags}>
            {tags.map((tag) => (
              <li key={tag.kind}>
                <Tag>{tag.text}</Tag>
              </li>
            ))}
          </ul>
        ) : null}
        <div className={styles.footer}>
          <Link
            strong
            to={alumniProfilePath(alumni.id)}
            state={directoryReturnState(directorySearch)}
          >
            {DIRECTORY_VIEW_PROFILE}
            <span className="visuallyHidden">{hiddenNamePart}</span>
          </Link>
        </div>
      </div>
    </Card>
  );
});
