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
  COMMENT_ADD_FORBIDDEN_TEXT,
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
import type { Session } from "../../../lib/token";
import { COMMENT_REQUIRED_MESSAGE } from "../../../lib/validation";
import { commentAddFailureText, isGone, isReplyTargetGone } from "../../../lib/writeFailure";
import type { CommentAddFailureWords } from "../../../lib/writeFailure";
import { addCommentAtom } from "../../../store/postActions";
import { commentsAtom, openCommentsAtom } from "../../../store/postAtoms";
import { showToastAtom } from "../../../store/toastAtoms";
import styles from "./CommentsPanel.module.css";

// The words for a failed new comment or reply (UI-003: a 403 has its own line).
const COMMENT_ADD_FAILURE_WORDS: CommentAddFailureWords = {
  replyTargetGone: COMMENT_REPLY_TARGET_GONE_TEXT,
  postGone: COMMENT_POST_GONE_TEXT,
  forbidden: COMMENT_ADD_FORBIDDEN_TEXT,
  save: COMMENT_SAVE_FAILURE_WORDS,
};

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
  // The same value, read when a send or save answers: that answer may close
  // the reply or edit only if it is still the one it was sent from, so a
  // reply or edit started meanwhile is not wiped (REFL-006).
  const activeRef = useRef<Active | null>(null);
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

  function changeActive(next: Active | null) {
    activeRef.current = next;
    setActiveState(next);
  }

  function handleReply(comment: Comment) {
    changeActive({ kind: "reply", id: comment.id, name: comment.name });
    requestFieldFocus();
  }

  function handleCancelReply() {
    changeActive(null);
    requestFieldFocus();
  }

  // Closes the edit of this comment, unless another reply or edit took over.
  function endEdit(commentId: number) {
    const current = activeRef.current;
    if (current?.kind === "edit" && current.id === commentId) {
      changeActive(null);
    }
  }

  async function handleAdd(content: string): Promise<FormResult> {
    const sentFrom = activeRef.current;
    const parentId = replyingTo?.id ?? null;
    const result = await addComment({ posts_id: postId, content, parent_id: parentId });
    // Still the reply (or plain comment) this was sent from: nothing newer to keep.
    const unchanged = activeRef.current === sentFrom;
    if (result.ok) {
      showToast(COMMENT_POSTED_TOAST);
      if (unchanged) {
        changeActive(null);
        requestFieldFocus();
      }
      return { ok: true, reset: true };
    }
    if ("blank" in result) {
      // Nothing was sent; the form blocks this first.
      return { ok: false, text: COMMENT_REQUIRED_MESSAGE };
    }
    if (isReplyTargetGone(result.failure, parentId) && unchanged) {
      // The reply is over; the typed text stays for a new comment.
      changeActive(null);
    }
    return {
      ok: false,
      text: commentAddFailureText(result.failure, parentId, COMMENT_ADD_FAILURE_WORDS),
    };
  }

  function renderItem(comment: Comment, replies?: Comment[]) {
    return (
      <CommentItem
        comment={comment}
        session={session}
        replyCount={countReplies(items, comment.id)}
        editing={active?.kind === "edit" && active.id === comment.id}
        onReply={handleReply}
        onStartEdit={(commentId) => changeActive({ kind: "edit", id: commentId })}
        onEndEdit={() => endEdit(comment.id)}
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
