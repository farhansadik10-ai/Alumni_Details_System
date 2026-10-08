import { useSetAtom } from "jotai";
import type { Comment } from "@alumni/shared";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "../../ui/Button/Button";
import { ConfirmDialog } from "../../ui/Dialog/ConfirmDialog";
import { Message } from "../../ui/Message/Message";
import { CommentForm } from "../CommentForm/CommentForm";
import { PostByline } from "../PostByline/PostByline";
import type { FormResult } from "../PostForm/PostForm";
import { PostText } from "../PostText/PostText";
import {
  CANCEL_LABEL,
  COMMENT_CHANGE_FORBIDDEN_TEXT,
  COMMENT_DELETED_TOAST,
  COMMENT_DELETE_CONFIRM,
  COMMENT_DELETE_TITLE,
  COMMENT_EDIT_LABEL,
  COMMENT_NOT_FOUND_TEXT,
  COMMENT_REPLY_BUTTON,
  COMMENT_SAVED_TOAST,
  COMMENT_SAVE_FAILURE_WORDS,
  DELETE_LABEL,
  DELETING_LABEL,
  EDIT_LABEL,
  SAVE_LABEL,
  SAVING_LABEL,
  commentDeleteBody,
} from "../../../config/text";
import { sameText } from "../../../lib/alumniDisplay";
import { canDeleteContent, canEditContent } from "../../../lib/contentOwner";
import type { Session } from "../../../lib/token";
import { COMMENT_REQUIRED_MESSAGE } from "../../../lib/validation";
import { isGone, writeFailureText } from "../../../lib/writeFailure";
import type { WriteFailureWords } from "../../../lib/writeFailure";
import { deleteCommentAtom, saveCommentAtom } from "../../../store/postActions";
import { showToastAtom } from "../../../store/toastAtoms";
import styles from "./CommentItem.module.css";

// The words for a failed edit or delete of a comment (AC18).
const COMMENT_WRITE_FAILURE_WORDS: WriteFailureWords = {
  forbidden: COMMENT_CHANGE_FORBIDDEN_TEXT,
  notFound: COMMENT_NOT_FOUND_TEXT,
  save: COMMENT_SAVE_FAILURE_WORDS,
};

export type CommentItemProps = {
  comment: Comment;
  session: Session | null;
  // How many comments sit below this one; the delete dialog says they go too.
  replyCount: number;
  // This comment is the one being edited (one edit or reply at a time).
  editing: boolean;
  onReply: (comment: Comment) => void;
  onStartEdit: (id: number) => void;
  onEndEdit: () => void;
  // The comment left the list (deleted, or found already gone). The panel
  // moves focus to the comment field in an effect after that commit (C11).
  onRemoved: () => void;
  // The replies of a top-level comment, drawn indented under it.
  children?: ReactNode;
};

/** One comment: byline, text, and Reply, Edit and Delete for those allowed. */
export function CommentItem({
  comment,
  session,
  replyCount,
  editing,
  onReply,
  onStartEdit,
  onEndEdit,
  onRemoved,
  children,
}: CommentItemProps) {
  const saveComment = useSetAtom(saveCommentAtom);
  const deleteComment = useSetAtom(deleteCommentAtom);
  const showToast = useSetAtom(showToastAtom);

  const editRef = useRef<HTMLButtonElement>(null);
  // Raised by Save and Cancel only: an edit closed because another comment
  // took over keeps focus where the user put it.
  const [focusEditRequest, setFocusEditRequest] = useState(0);
  // `editing` now, read when a save answers: if another reply or edit took
  // over meanwhile, the answer must not close it or move focus (REFL-006).
  const editingRef = useRef(editing);
  useEffect(() => {
    editingRef.current = editing;
  }, [editing]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const confirmOpenRef = useRef(false);
  const deletingRef = useRef(false);

  useEffect(() => {
    if (focusEditRequest > 0 && !editing) {
      editRef.current?.focus();
    }
  }, [focusEditRequest, editing]);

  const mayEdit = canEditContent(session, comment.user_id);
  const mayDelete = canDeleteContent(session, comment.user_id);

  function closeEdit() {
    onEndEdit();
    setFocusEditRequest((current) => current + 1);
  }

  async function handleSave(content: string): Promise<FormResult> {
    // Nothing changed (trimmed): close the form with no request and no toast,
    // because nothing was saved (REQ-fs-007 A7).
    if (sameText(content, comment.content ?? "")) {
      if (editingRef.current) {
        closeEdit();
      }
      return { ok: true };
    }
    const result = await saveComment({ id: comment.id, content });
    if (result.ok) {
      if (editingRef.current) {
        closeEdit();
      }
      showToast(COMMENT_SAVED_TOAST);
      return { ok: true };
    }
    if ("blank" in result) {
      // Nothing was sent; the form blocks this first.
      return { ok: false, text: COMMENT_REQUIRED_MESSAGE };
    }
    if (isGone(result.failure)) {
      // The store took the comment off the list, so this form goes with it.
      showToast(COMMENT_NOT_FOUND_TEXT);
      onRemoved();
    }
    return { ok: false, text: writeFailureText(result.failure, COMMENT_WRITE_FAILURE_WORDS) };
  }

  function openConfirm() {
    setDeleteError(null);
    confirmOpenRef.current = true;
    setConfirmOpen(true);
  }

  // Cancel and Escape, also while the delete runs: the browser closes the
  // dialog on a second Escape anyway, so the flag always follows it. A failure
  // that answers after the close becomes a toast (handleConfirmDelete).
  function closeConfirm() {
    confirmOpenRef.current = false;
    setConfirmOpen(false);
  }

  async function handleConfirmDelete() {
    if (deletingRef.current) {
      return;
    }
    deletingRef.current = true;
    setDeleting(true);
    setDeleteError(null);
    const result = await deleteComment(comment.id);
    deletingRef.current = false;
    setDeleting(false);

    if (result.ok || isGone(result.failure)) {
      // The store removed the comment and its replies; this item leaves.
      confirmOpenRef.current = false;
      setConfirmOpen(false);
      showToast(result.ok ? COMMENT_DELETED_TOAST : COMMENT_NOT_FOUND_TEXT);
      onRemoved();
      return;
    }
    const text = writeFailureText(result.failure, COMMENT_WRITE_FAILURE_WORDS);
    if (confirmOpenRef.current) {
      setDeleteError(text);
    } else {
      showToast(text);
    }
  }

  return (
    <div className={styles.item}>
      <PostByline
        name={comment.name}
        photoUrl={comment.photo_url}
        createdAt={comment.created_at}
        size="sm"
      >
        {editing ? (
          <CommentForm
            label={COMMENT_EDIT_LABEL}
            initialValue={comment.content ?? ""}
            submitLabel={SAVE_LABEL}
            busyLabel={SAVING_LABEL}
            autoFocus
            onSubmit={handleSave}
            onCancel={closeEdit}
          />
        ) : (
          <>
            <PostText text={comment.content} size="sm" />
            <div className={styles.actions}>
              <Button variant="quiet" size="sm" onClick={() => onReply(comment)}>
                {COMMENT_REPLY_BUTTON}
              </Button>
              {mayEdit ? (
                <Button
                  ref={editRef}
                  variant="quiet"
                  size="sm"
                  onClick={() => onStartEdit(comment.id)}
                >
                  {EDIT_LABEL}
                </Button>
              ) : null}
              {mayDelete ? (
                <Button variant="quiet" tone="danger" size="sm" onClick={openConfirm}>
                  {DELETE_LABEL}
                </Button>
              ) : null}
            </div>
          </>
        )}
        {children}
      </PostByline>

      <ConfirmDialog
        open={confirmOpen}
        onClose={closeConfirm}
        onConfirm={() => void handleConfirmDelete()}
        title={COMMENT_DELETE_TITLE}
        confirmLabel={deleting ? DELETING_LABEL : COMMENT_DELETE_CONFIRM}
        cancelLabel={CANCEL_LABEL}
        danger
        busy={deleting}
      >
        <div className={styles.dialogBody}>
          <p className={styles.dialogText}>{commentDeleteBody(replyCount)}</p>
          {deleteError !== null ? <Message tone="error">{deleteError}</Message> : null}
        </div>
      </ConfirmDialog>
    </div>
  );
}
