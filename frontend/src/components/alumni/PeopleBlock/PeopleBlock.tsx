import { useId } from "react";
import type { Alumni } from "@alumni/shared";
import type { To } from "react-router-dom";
import { displayName, jobLine } from "../../../lib/alumniDisplay";
import { loadFailureText } from "../../../lib/loadFailure";
import { alumniProfilePath } from "../../../routes/paths";
import type { ApiFailure } from "../../../store/postAtoms";
import { Avatar } from "../../ui/Avatar/Avatar";
import { EmptyState } from "../../ui/EmptyState/EmptyState";
import { ErrorState } from "../../ui/ErrorState/ErrorState";
import { Link } from "../../ui/Link/Link";
import { Skeleton, SkeletonGroup, SkeletonStack } from "../../ui/Skeleton/Skeleton";
import styles from "./PeopleBlock.module.css";

// The rows the skeleton draws: the lists show three people.
const SKELETON_ROWS = [0, 1, 2];

/**
 * What the block draws. The page maps its `peopleAtom` into this: an idle
 * state, or one of another `kind`, is passed as "loading" (pattern 23).
 */
export type PeopleBlockState = {
  status: "loading" | "ready" | "error";
  items: Alumni[];
  failure: ApiFailure | null;
};

export type PeopleBlockProps = {
  heading: string;
  state: PeopleBlockState;
  emptyHeading: string;
  emptyText: string;
  errorHeading: string;
  onRetry: () => void;
  // The link under the list, to the directory. Shown in every state but loading.
  footerLink?: { label: string; to: To };
  // "plain": the Dashboard's list, a ruled list under a large heading.
  // "card": the Feed's side list, inside a card with a smaller heading.
  variant?: "plain" | "card";
};

/**
 * A short list of people: "New in the directory" on the Dashboard, "Open to
 * mentoring" beside the Feed (dashboard.html, feed.html). Each name links to
 * that person's profile; the second line is the job, left out when there is none.
 */
export function PeopleBlock({
  heading,
  state,
  emptyHeading,
  emptyText,
  errorHeading,
  onRetry,
  footerLink,
  variant = "plain",
}: PeopleBlockProps) {
  const headingId = useId();

  let body;
  if (state.status === "error") {
    body = (
      <ErrorState
        heading={errorHeading}
        headingAs="h3"
        text={loadFailureText(state.failure)}
        retryVariant="secondary"
        onRetry={onRetry}
      />
    );
  } else if (state.status === "loading") {
    body = (
      <SkeletonGroup>
        <ul className={styles.list} aria-hidden="true">
          {SKELETON_ROWS.map((row) => (
            <li key={row} className={styles.row}>
              <Skeleton shape="avatar-sm" />
              <SkeletonStack>
                <Skeleton shape="title" />
                <Skeleton shape="line" />
              </SkeletonStack>
            </li>
          ))}
        </ul>
      </SkeletonGroup>
    );
  } else if (state.items.length === 0) {
    body = <EmptyState heading={emptyHeading} text={emptyText} headingAs="h3" />;
  } else {
    body = (
      <ul className={styles.list}>
        {state.items.map((person) => {
          const job = jobLine(person.job_title, person.current_company);
          return (
            <li key={person.id} className={styles.row}>
              <Avatar name={person.name} photoUrl={person.photo_url} size="sm" />
              <div className={styles.who}>
                <span className={styles.name}>
                  <Link strong to={alumniProfilePath(person.id)}>
                    {displayName(person.name)}
                  </Link>
                </span>
                {job !== null ? <span className={styles.job}>{job}</span> : null}
              </div>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <section className={`${styles.block} ${styles[variant]}`} aria-labelledby={headingId}>
      <h2 id={headingId} className={styles.heading}>
        {heading}
      </h2>
      {body}
      {footerLink !== undefined && state.status !== "loading" ? (
        <p className={styles.footer}>
          <Link strong to={footerLink.to}>
            {footerLink.label}
          </Link>
        </p>
      ) : null}
    </section>
  );
}
