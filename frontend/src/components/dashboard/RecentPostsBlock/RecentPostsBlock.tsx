import { useId } from "react";
import type { ReactNode } from "react";
import type { Post } from "@alumni/shared";
import { loadFailureText } from "../../../lib/loadFailure";
import type { ApiFailure } from "../../../store/postAtoms";
import { PostSummaryCard } from "../../posts/PostSummaryCard/PostSummaryCard";
import { Card } from "../../ui/Card/Card";
import { EmptyState } from "../../ui/EmptyState/EmptyState";
import { ErrorState } from "../../ui/ErrorState/ErrorState";
import { Skeleton, SkeletonGroup, SkeletonStack } from "../../ui/Skeleton/Skeleton";
import styles from "./RecentPostsBlock.module.css";

// The cards the skeleton draws: the block shows three posts.
const SKELETON_CARDS = [0, 1, 2];

/**
 * What the block draws. The page maps its `recentPostsAtom` into this: an
 * idle state, or one of another `authorId`, is passed as "loading" (pattern 23).
 */
export type RecentPostsBlockState = {
  status: "loading" | "ready" | "error";
  items: Post[];
  failure: ApiFailure | null;
};

export type RecentPostsBlockProps = {
  heading: string;
  state: RecentPostsBlockState;
  // The author over each post (Dashboard); off on a profile, where the author is the page.
  showAuthor: boolean;
  emptyHeading: string;
  emptyText: string;
  // The next step from the empty state, a link to another page ("Open the feed").
  emptyAction?: { label: string; to: string };
  errorHeading: string;
  onRetry: () => void;
  // Beside the heading, e.g. the "Write a post" ButtonLink. The page leaves it
  // out for a user who cannot post (a student).
  action?: ReactNode;
};

/**
 * The newest few posts: the Dashboard's "Recent posts" (everyone's) and the
 * alumni profile's (one author's). Same cards in both (PostSummaryCard).
 */
export function RecentPostsBlock({
  heading,
  state,
  showAuthor,
  emptyHeading,
  emptyText,
  emptyAction,
  errorHeading,
  onRetry,
  action,
}: RecentPostsBlockProps) {
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
        <div className={styles.list} aria-hidden="true">
          {SKELETON_CARDS.map((card) => (
            <Card key={card}>
              <SkeletonStack>
                <Skeleton shape="title" />
                <Skeleton shape="line" />
                <Skeleton shape="line" />
              </SkeletonStack>
            </Card>
          ))}
        </div>
      </SkeletonGroup>
    );
  } else if (state.items.length === 0) {
    body = (
      <EmptyState
        heading={emptyHeading}
        text={emptyText}
        headingAs="h3"
        actionLabel={emptyAction?.label}
        actionTo={emptyAction?.to}
      />
    );
  } else {
    body = (
      <div className={styles.list}>
        {state.items.map((post) => (
          <PostSummaryCard key={post.id} post={post} showAuthor={showAuthor} />
        ))}
      </div>
    );
  }

  return (
    <section className={styles.block} aria-labelledby={headingId}>
      <div className={styles.top}>
        <h2 id={headingId} className={styles.heading}>
          {heading}
        </h2>
        {action}
      </div>
      {body}
    </section>
  );
}
