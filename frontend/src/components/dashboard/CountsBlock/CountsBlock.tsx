import { useId } from "react";
import type { Stats } from "@alumni/shared";
import type { To } from "react-router-dom";
import {
  DASHBOARD_COUNTS_ERROR_HEADING,
  DASHBOARD_COUNTS_HEADING,
  DASHBOARD_COUNT_ALUMNI_LABEL,
  DASHBOARD_COUNT_ALUMNI_LINK,
  DASHBOARD_COUNT_MENTORING_LABEL,
  DASHBOARD_COUNT_MENTORING_LINK,
  DASHBOARD_COUNT_POSTS_LABEL,
  DASHBOARD_COUNT_POSTS_LINK,
} from "../../../config/text";
import { mentoringDirectoryAddress } from "../../../lib/directoryQuery";
import { loadFailureText } from "../../../lib/loadFailure";
import { PATHS } from "../../../routes/paths";
import type { ApiFailure } from "../../../store/postAtoms";
import { Card } from "../../ui/Card/Card";
import { ErrorState } from "../../ui/ErrorState/ErrorState";
import { Link } from "../../ui/Link/Link";
import { Skeleton, SkeletonGroup, SkeletonStack } from "../../ui/Skeleton/Skeleton";
import styles from "./CountsBlock.module.css";

/** What the block draws. The page passes an idle `statsAtom` as "loading". */
export type CountsBlockState = {
  status: "loading" | "ready" | "error";
  stats: Stats | null;
  failure: ApiFailure | null;
};

export type CountsBlockProps = {
  state: CountsBlockState;
  onRetry: () => void;
};

type CountCard = {
  key: keyof Stats;
  label: string;
  linkLabel: string;
  to: To;
};

// The directory with "open to mentoring" on, written by the directory's own rule.
const MENTORING_DIRECTORY: To = mentoringDirectoryAddress(PATHS.directory);

// The three cards of dashboard.html. `students` is not shown (the design has three).
const CARDS: readonly CountCard[] = [
  {
    key: "alumni",
    label: DASHBOARD_COUNT_ALUMNI_LABEL,
    linkLabel: DASHBOARD_COUNT_ALUMNI_LINK,
    to: PATHS.directory,
  },
  {
    key: "mentoring",
    label: DASHBOARD_COUNT_MENTORING_LABEL,
    linkLabel: DASHBOARD_COUNT_MENTORING_LINK,
    to: MENTORING_DIRECTORY,
  },
  {
    key: "posts",
    label: DASHBOARD_COUNT_POSTS_LABEL,
    linkLabel: DASHBOARD_COUNT_POSTS_LINK,
    to: PATHS.feed,
  },
];

/**
 * The counts at the top of the Dashboard: alumni, open to mentoring, posts.
 * A count of 0 shows "0". On a failure one error replaces the three cards.
 * The heading is for screen readers only (the design draws none).
 */
export function CountsBlock({ state, onRetry }: CountsBlockProps) {
  const headingId = useId();
  const { stats } = state;

  let body;
  if (state.status === "error" || (state.status === "ready" && stats === null)) {
    body = (
      <ErrorState
        heading={DASHBOARD_COUNTS_ERROR_HEADING}
        headingAs="h3"
        text={loadFailureText(state.failure)}
        retryVariant="secondary"
        onRetry={onRetry}
      />
    );
  } else if (state.status === "loading" || stats === null) {
    body = (
      <SkeletonGroup>
        <div className={styles.grid} aria-hidden="true">
          {CARDS.map((card) => (
            <Card key={card.key}>
              <SkeletonStack>
                <Skeleton shape="line" />
                <Skeleton shape="title" />
                <Skeleton shape="line" />
              </SkeletonStack>
            </Card>
          ))}
        </div>
      </SkeletonGroup>
    );
  } else {
    body = (
      <ul className={styles.grid}>
        {CARDS.map((card) => (
          <li key={card.key} className={styles.item}>
            <Card>
              <div className={styles.card}>
                <p className={styles.label}>{card.label}</p>
                <p className={styles.number}>{String(stats[card.key])}</p>
                <p className={styles.link}>
                  <Link strong to={card.to}>
                    {card.linkLabel}
                  </Link>
                </p>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section className={styles.block} aria-labelledby={headingId}>
      <h2 id={headingId} className="visuallyHidden">
        {DASHBOARD_COUNTS_HEADING}
      </h2>
      {body}
    </section>
  );
}
