import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useAtomValue, useSetAtom, useStore } from "jotai";
import type { To } from "react-router-dom";
import { PeopleBlock } from "../../components/alumni/PeopleBlock/PeopleBlock";
import { FeedPost } from "../../components/posts/FeedPost/FeedPost";
import { PostForm } from "../../components/posts/PostForm/PostForm";
import type { FormResult, PostFormValues } from "../../components/posts/PostForm/PostForm";
import { PageLayout } from "../../components/shell/PageLayout/PageLayout";
import { Button } from "../../components/ui/Button/Button";
import { Card } from "../../components/ui/Card/Card";
import { EmptyState } from "../../components/ui/EmptyState/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState/ErrorState";
import { Message } from "../../components/ui/Message/Message";
import { Skeleton, SkeletonGroup } from "../../components/ui/Skeleton/Skeleton";
import {
  FEED_EMPTY_HEADING,
  FEED_EMPTY_READER_TEXT,
  FEED_EMPTY_WRITER_ACTION,
  FEED_EMPTY_WRITER_TEXT,
  FEED_ERROR_HEADING,
  FEED_HEADING,
  FEED_LOADING_TEXT,
  FEED_LOAD_MORE_BUSY,
  FEED_LOAD_MORE_BUTTON,
  FEED_MENTORING_HEADING,
  FEED_MORE_ERROR_HEADING,
  FEED_POSTS_HEADING,
  FEED_STUDENT_NOTE,
  FEED_SUB,
  PEOPLE_DIRECTORY_LINK,
  PEOPLE_ERROR_HEADING,
  PEOPLE_MENTORING_EMPTY_HEADING,
  PEOPLE_MENTORING_EMPTY_TEXT,
  POST_FORM_HEADING,
  POST_GONE_TEXT,
  POST_NOT_FOUND_TEXT,
  POST_PUBLISHED_TOAST,
  POST_PUBLISH_BUSY,
  POST_PUBLISH_BUTTON,
  POST_SAVE_FAILURE_WORDS,
  POST_WHO_CAN_POST,
  RETRY_LABEL,
  feedShowingText,
} from "../../config/text";
import { mentoringDirectoryAddress } from "../../lib/directoryQuery";
import { loadFailureText } from "../../lib/loadFailure";
import { canWritePosts } from "../../lib/token";
import { writeFailureText } from "../../lib/writeFailure";
import type { WriteFailureWords } from "../../lib/writeFailure";
import { PATHS } from "../../routes/paths";
import { toPeopleBlockState } from "../../store/peopleBlockState";
import { publishPostAtom } from "../../store/postActions";
import {
  clearFeedAtom,
  clearPeopleAtom,
  closeCommentsAtom,
  commentsAtom,
  feedAtom,
  loadFeedAtom,
  loadMoreFeedAtom,
  loadPeopleAtom,
  openCommentsAtom,
  peopleAtom,
  removePostLocallyAtom,
} from "../../store/postAtoms";
import { sessionAtom } from "../../store/sessionAtoms";
import { showToastAtom } from "../../store/toastAtoms";
import styles from "./FeedPage.module.css";

// The skeleton cards drawn while the first page loads.
const SKELETON_POSTS = [0, 1, 2];

// A failed publish: 403 means the user may not post. A 404 cannot happen on a
// create; it keeps the general "gone" words, as saveFailureText gives them.
const PUBLISH_FAILURE_WORDS: WriteFailureWords = {
  forbidden: POST_WHO_CAN_POST,
  notFound: POST_GONE_TEXT,
  save: POST_SAVE_FAILURE_WORDS,
};

// "See all in the directory": the directory with "open to mentoring" on,
// written by the directory's own rule (pattern 24).
const MENTORING_DIRECTORY: To = mentoringDirectoryAddress(PATHS.directory);

/**
 * The Feed (feed.html, AC1 to AC9, AC15 to AC20, AC35): the posts, newest
 * first, with "Load more"; the composer for alumni and admin, a note for a
 * student; and the people open to mentoring beside it. The posts and the side
 * list load when the page opens and are forgotten when it closes.
 */
export default function FeedPage() {
  const store = useStore();
  const session = useAtomValue(sessionAtom);
  const feed = useAtomValue(feedAtom);
  const comments = useAtomValue(commentsAtom);
  const people = useAtomValue(peopleAtom);

  const loadFeed = useSetAtom(loadFeedAtom);
  const loadMoreFeed = useSetAtom(loadMoreFeedAtom);
  const clearFeed = useSetAtom(clearFeedAtom);
  const loadPeople = useSetAtom(loadPeopleAtom);
  const clearPeople = useSetAtom(clearPeopleAtom);
  const openComments = useSetAtom(openCommentsAtom);
  const closeComments = useSetAtom(closeCommentsAtom);
  const removePostLocally = useSetAtom(removePostLocallyAtom);
  const publishPost = useSetAtom(publishPostAtom);
  const showToast = useSetAtom(showToastAtom);

  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const postsHeadingRef = useRef<HTMLHeadingElement>(null);
  // Raised when a post leaves the list (deleted, or found gone). The effect
  // focuses the list heading after that commit, never inside a promise
  // chain while a dialog may still be open (C11, ADV-004).
  const [focusHeadingRequest, setFocusHeadingRequest] = useState(0);

  const userId = session?.userId ?? null;
  const writer = canWritePosts(session?.role ?? null);

  // Both loads start when the page opens, and again for another user; both
  // are forgotten when it closes, so the next visit never starts from this
  // one (AC35, LESSON-REQ-fs-005-2). StrictMode's second run is harmless:
  // the latest request wins.
  useEffect(() => {
    if (userId === null) {
      return undefined;
    }
    void loadFeed();
    void loadPeople("mentoring");
    return () => {
      clearFeed();
      clearPeople();
    };
  }, [userId, loadFeed, loadPeople, clearFeed, clearPeople]);

  useEffect(() => {
    if (focusHeadingRequest > 0) {
      postsHeadingRef.current?.focus();
    }
  }, [focusHeadingRequest]);

  const requestHeadingFocus = useCallback(() => {
    setFocusHeadingRequest((current) => current + 1);
  }, []);

  // The post left the list already (the store removed it); focus follows.
  const handlePostDeleted = useCallback(() => {
    requestHeadingFocus();
  }, [requestHeadingFocus]);

  // Its comments answered 404: the post is gone. A stable function, since the
  // comments panel's effect depends on it.
  const handlePostGone = useCallback(
    (postId: number) => {
      removePostLocally(postId);
      showToast(POST_NOT_FOUND_TEXT);
      requestHeadingFocus();
    },
    [removePostLocally, showToast, requestHeadingFocus],
  );

  const retryPeople = useCallback(() => void loadPeople("mentoring"), [loadPeople]);

  // Stable, so a memoized FeedPost does not draw again when another post's
  // thread opens (AC26): the open post is read from the store at the press.
  const handleToggleComments = useCallback(
    (postId: number) => {
      if (store.get(commentsAtom).postId === postId) {
        closeComments();
      } else {
        void openComments(postId);
      }
    },
    [store, closeComments, openComments],
  );

  function retryFeed() {
    void loadFeed();
    // "Try again" goes with the error state; the list heading stays.
    postsHeadingRef.current?.focus();
  }

  async function handlePublish(values: PostFormValues): Promise<FormResult> {
    const result = await publishPost({ caption: values.caption, media_url: values.mediaUrl });
    if (!result.ok) {
      return { ok: false, text: writeFailureText(result.failure, PUBLISH_FAILURE_WORDS) };
    }
    showToast(POST_PUBLISHED_TOAST);
    composerRef.current?.focus();
    return { ok: true, reset: true };
  }

  const loading = feed.status === "idle" || feed.status === "loading";
  const ready = feed.status === "ready";
  const hasMore = ready && feed.items.length < feed.total;

  let statusText = "";
  if (loading) {
    statusText = FEED_LOADING_TEXT;
  } else if (ready && feed.items.length > 0) {
    statusText = feedShowingText(feed.items.length, feed.total);
  }

  // The first card of the column overlaps the band. While the feed loads or
  // has failed that is the skeleton or the error; the composer (or the
  // student's note) is drawn only on a ready feed, so a write always lands
  // on a list that can show it (ADV-003).
  let top: ReactNode = null;
  if (ready) {
    top = writer ? (
      <Card>
        <PostForm
          ref={composerRef}
          captionLabel={POST_FORM_HEADING}
          submitLabel={POST_PUBLISH_BUTTON}
          busyLabel={POST_PUBLISH_BUSY}
          onSubmit={handlePublish}
        />
      </Card>
    ) : (
      <Card>
        <p className={styles.note}>{FEED_STUDENT_NOTE}</p>
      </Card>
    );
  }

  let list: ReactNode;
  if (loading) {
    list = (
      <SkeletonGroup>
        <div className={styles.posts} aria-hidden="true">
          {SKELETON_POSTS.map((row) => (
            <Card key={row}>
              <div className={styles.skeletonPost}>
                <div className={styles.skeletonByline}>
                  <Skeleton shape="avatar-md" />
                  <div className={styles.skeletonWho}>
                    <Skeleton shape="title" />
                    <Skeleton shape="line" />
                  </div>
                </div>
                <Skeleton shape="line" />
                <Skeleton shape="line" />
              </div>
            </Card>
          ))}
        </div>
      </SkeletonGroup>
    );
  } else if (feed.status === "error") {
    list = (
      <ErrorState
        heading={FEED_ERROR_HEADING}
        headingAs="h3"
        text={loadFailureText(feed.failure)}
        onRetry={retryFeed}
      />
    );
  } else if (feed.items.length === 0) {
    list = writer ? (
      <EmptyState
        heading={FEED_EMPTY_HEADING}
        headingAs="h3"
        text={FEED_EMPTY_WRITER_TEXT}
        actionLabel={FEED_EMPTY_WRITER_ACTION}
        onAction={() => composerRef.current?.focus()}
      />
    ) : (
      <EmptyState heading={FEED_EMPTY_HEADING} headingAs="h3" text={FEED_EMPTY_READER_TEXT} />
    );
  } else {
    list = (
      <ul className={styles.posts}>
        {feed.items.map((post) => (
          <li key={post.id}>
            <FeedPost
              post={post}
              session={session}
              open={comments.postId === post.id}
              onToggleComments={handleToggleComments}
              onDeleted={handlePostDeleted}
              onPostGone={handlePostGone}
            />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <PageLayout heading={FEED_HEADING} sub={FEED_SUB}>
      <div className={styles.columns}>
        <div className={styles.main}>
          {top}

          {/* Outside the list branch, so it is still here to take focus when
              the last post is deleted (ADV-004). */}
          <h2 ref={postsHeadingRef} className="visuallyHidden" tabIndex={-1}>
            {FEED_POSTS_HEADING}
          </h2>
          <p className="visuallyHidden" role="status">
            {statusText}
          </p>

          {list}

          {ready && feed.more === "error" ? (
            <Message tone="error">
              <span className={styles.moreError}>
                <strong>{FEED_MORE_ERROR_HEADING}</strong>
                <span>{loadFailureText(feed.moreFailure)}</span>
              </span>
            </Message>
          ) : null}

          {/* One button for "Load more" and its "Try again", so focus stays
              on it across a failure and a retry. */}
          {hasMore ? (
            <div className={styles.more}>
              <Button
                variant="secondary"
                busy={feed.more === "loading"}
                busyLabel={FEED_LOAD_MORE_BUSY}
                onClick={() => void loadMoreFeed()}
              >
                {feed.more === "error" ? RETRY_LABEL : FEED_LOAD_MORE_BUTTON}
              </Button>
            </div>
          ) : null}
        </div>

        <aside className={styles.side}>
          <PeopleBlock
            heading={FEED_MENTORING_HEADING}
            state={toPeopleBlockState(people, "mentoring")}
            emptyHeading={PEOPLE_MENTORING_EMPTY_HEADING}
            emptyText={PEOPLE_MENTORING_EMPTY_TEXT}
            errorHeading={PEOPLE_ERROR_HEADING}
            onRetry={retryPeople}
            footerLink={{ label: PEOPLE_DIRECTORY_LINK, to: MENTORING_DIRECTORY }}
            variant="card"
          />
        </aside>
      </div>
    </PageLayout>
  );
}
