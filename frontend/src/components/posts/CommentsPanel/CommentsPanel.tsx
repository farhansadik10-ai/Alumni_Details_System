import { useAtomValue, useSetAtom } from "jotai";
import type { Comment } from "@alumni/shared";
import { useEffect, useId, useRef, useState } from "react";
import { EmptyState } from "../../ui/EmptyState/EmptyState";
import { ErrorState } from "../../ui/ErrorState/ErrorState";
import { Skeleton, SkeletonGroup, SkeletonStack } from "../../ui/Skeleton/Skeleton";
import { CommentForm } from "../CommentForm/CommentForm";
import { CommentItem } from "../CommentItem/CommentItem";
import type { FormResult } from "../PostForm/PostForm";
import {
  COMMENTS_EMPTY_HEADING,
  COMMENTS_EMPTY_TEXT,
  COMMENTS_ERROR_HEADING,
  COMMENTS_HEADING,
  COMMENT_FIELD_LABEL,
  COMMENT_POSTED_TOAST,
  COMMENT_POST_GONE_TEXT,
  COMMENT_REPLY_TARGET_GONE_TEXT,
  COMMENT_SAVE_FAILURE_WORDS,
  COMMENT_SUBMIT_BUSY,
  COMMENT_SUBMIT_BUTTON,
} from "../../../config/text";
import { buildThreads, countReplies } from "../../../lib/commentThread";
import { loadFailureText } from "../../../lib/loadFailure";
import { saveFailureText } from "../../../lib/saveFailure";
import type { Session } from "../../../lib/token";
import { isGone } from "../../../lib/writeFailure";
import { addCommentAtom } from "../../../store/postActions";
import { commentsAtom, openCommentsAtom } from "../../../store/postAtoms";
import { showToastAtom } from "../../../store/toastAtoms";
import styles from "./CommentsPanel.module.css";

// The API answers 400 to a reply whose parent comment no longer exists (ADV-005).
const HTTP_BAD_REQUEST = 400;

// One reply or one edit at a time, across the whole thread.
type Active =
  | { kind: "reply"; id: number; name: string | null }
  | { kind: "edit"; id: number };

export type CommentsPanelProps = {
  // The id the post's comments button points at (aria-controls).
  id: string;
  postId: number;
  session: Session | null;
  // The thread answered 404: the post is gone. The page removes it and says so.
  onPostGone: (postId: number) => void;
};

/**
 * The open comment thread of one post (C3): its states, the threads with
 * replies indented one level, and the comment form. It reads the one
 * comments atom; another post's state there counts as loading (pattern 23).
 */
export function CommentsPanel({ id, postId, session, onPostGone }: CommentsPanelProps) {
  const comments = useAtomValue(commentsAtom);
  const openComments = useSetAtom(openCommentsAtom);
  const addComment = useSetAtom(addCommentAtom);
  const showToast = useSetAtom(showToastAtom);

  const headingId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const fieldRef = useRef<HTMLTextAreaElement>(null);

  const [activeState, setActiveState] = useState<Active | null>(null);
  // Raised after a comment is added, removed or a reply is started; the
  // effect moves focus to the field after that commit (C11).
  const [focusFieldRequest, setFocusFieldRequest] = useState(0);
  // The 404 already reported, so StrictMode's second effect run does not
  // report it again (G48).
  const reportedGone = useRef<unknown>(null);

  const isThisPost = comments.postId === postId;
  const status = isThisPost ? comments.status : "loading";
  const items = isThisPost && status === "ready" ? comments.items : [];
  const failure = isThisPost ? comments.failure : null;

  // A reply or edit whose comment has gone (deleted here or found gone) is over.
  const active =
    activeState !== null && items.some((item) => item.id === activeState.id) ? activeState : null;
  const replyingTo = active?.kind === "reply" ? active : null;

  useEffect(() => {
    if (focusFieldRequest > 0) {
      fieldRef.current?.focus();
    }
  }, [focusFieldRequest]);

  const postGone = status === "error" && failure !== null && isGone(failure);
  useEffect(() => {
    if (postGone && reportedGone.current !== failure) {
      reportedGone.current = failure;
      onPostGone(postId);
    }
  }, [postGone, failure, postId, onPostGone]);

  function requestFieldFocus() {
    setFocusFieldRequest((current) => current + 1);
  }

  function handleRetry() {
    void openComments(postId);
    // "Try again" goes away with the error state; the heading stays.
    headingRef.current?.focus();
  }

  function handleReply(comment: Comment) {
    setActiveState({ kind: "reply", id: comment.id, name: comment.name });
    requestFieldFocus();
  }

  function handleCancelReply() {
    setActiveState(null);
    requestFieldFocus();
  }

  async function handleAdd(content: string): Promise<FormResult> {
    const parentId = replyingTo?.id ?? null;
    const result = await addComment({ posts_id: postId, content, parent_id: parentId });
    if (result.ok) {
      setActiveState(null);
      showToast(COMMENT_POSTED_TOAST);
      requestFieldFocus();
      return { ok: true, reset: true };
    }
    const { failure: addFailure } = result;
    if (addFailure.kind === "http" && addFailure.status === HTTP_BAD_REQUEST && parentId !== null) {
      setActiveState(null);
      return { ok: false, text: COMMENT_REPLY_TARGET_GONE_TEXT };
    }
    if (isGone(addFailure)) {
      return { ok: false, text: COMMENT_POST_GONE_TEXT };
    }
    return { ok: false, text: saveFailureText(addFailure, COMMENT_SAVE_FAILURE_WORDS) };
  }

  function renderItem(comment: Comment, replies?: Comment[]) {
    return (
      <CommentItem
        comment={comment}
        session={session}
        replyCount={countReplies(items, comment.id)}
        editing={active?.kind === "edit" && active.id === comment.id}
        onReply={handleReply}
        onStartEdit={(commentId) => setActiveState({ kind: "edit", id: commentId })}
        onEndEdit={() => setActiveState(null)}
        onRemoved={requestFieldFocus}
      >
        {replies !== undefined && replies.length > 0 ? (
          <ul className={styles.replies}>
            {replies.map((reply) => (
              <li key={reply.id} className={styles.reply}>
                {renderItem(reply)}
              </li>
            ))}
          </ul>
        ) : null}
      </CommentItem>
    );
  }

  let body;
  if (status === "ready") {
    const threads = buildThreads(items);
    body = (
      <>
        {threads.length === 0 ? (
          <EmptyState
            heading={COMMENTS_EMPTY_HEADING}
            headingAs="h3"
            text={COMMENTS_EMPTY_TEXT}
          />
        ) : (
          <ul className={styles.threads}>
            {threads.map((thread) => (
              <li key={thread.comment.id}>{renderItem(thread.comment, thread.replies)}</li>
            ))}
          </ul>
        )}
        <CommentForm
          ref={fieldRef}
          label={COMMENT_FIELD_LABEL}
          submitLabel={COMMENT_SUBMIT_BUTTON}
          busyLabel={COMMENT_SUBMIT_BUSY}
          replyingTo={replyingTo?.name ?? null}
          onCancel={replyingTo !== null ? handleCancelReply : undefined}
          onSubmit={handleAdd}
        />
      </>
    );
  } else if (status === "error" && !postGone) {
    body = (
      <ErrorState
        heading={COMMENTS_ERROR_HEADING}
        headingAs="h3"
        text={loadFailureText(failure)}
        retryVariant="secondary"
        onRetry={handleRetry}
      />
    );
  } else {
    // Loading, idle, another post's state, or a 404 the page is removing.
    body = (
      <SkeletonGroup layout="row">
        <Skeleton shape="avatar-sm" />
        <SkeletonStack>
          <Skeleton />
          <Skeleton />
        </SkeletonStack>
      </SkeletonGroup>
    );
  }

  return (
    <section id={id} className={styles.panel} aria-labelledby={headingId}>
      <h3 ref={headingRef} id={headingId} className="visuallyHidden" tabIndex={-1}>
        {COMMENTS_HEADING}
      </h3>
      {body}
    </section>
  );
}
