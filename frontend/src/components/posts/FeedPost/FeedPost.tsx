import { useSetAtom } from "jotai";
import type { Post } from "@alumni/shared";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "../../ui/Button/Button";
import { Card } from "../../ui/Card/Card";
import { ConfirmDialog } from "../../ui/Dialog/ConfirmDialog";
import { Message } from "../../ui/Message/Message";
import { CommentsPanel } from "../CommentsPanel/CommentsPanel";
import { PostByline } from "../PostByline/PostByline";
import { PostForm } from "../PostForm/PostForm";
import type { FormResult, PostFormValues } from "../PostForm/PostForm";
import { PostText } from "../PostText/PostText";
import {
  CANCEL_LABEL,
  DELETE_LABEL,
  DELETING_LABEL,
  EDIT_LABEL,
  POST_CHANGE_FORBIDDEN_TEXT,
  POST_DELETED_TOAST,
  POST_DELETE_CONFIRM,
  POST_DELETE_TITLE,
  POST_EDIT_LABEL,
  POST_NOT_FOUND_TEXT,
  POST_SAVED_TOAST,
  POST_SAVE_FAILURE_WORDS,
  SAVE_LABEL,
  SAVING_LABEL,
  postDeleteBody,
  postImageAlt,
} from "../../../config/text";
import { displayName } from "../../../lib/alumniDisplay";
import { canDeleteContent, canEditContent } from "../../../lib/contentOwner";
import { commentCountText } from "../../../lib/postDisplay";
import type { Session } from "../../../lib/token";
import { isWebLink } from "../../../lib/validation";
import { isGone, writeFailureText } from "../../../lib/writeFailure";
import type { WriteFailureWords } from "../../../lib/writeFailure";
import { deletePostAtom, savePostAtom } from "../../../store/postActions";
import { showToastAtom } from "../../../store/toastAtoms";
import styles from "./FeedPost.module.css";

// The words for a failed edit or delete of a post (AC18).
const POST_WRITE_FAILURE_WORDS: WriteFailureWords = {
  forbidden: POST_CHANGE_FORBIDDEN_TEXT,
  notFound: POST_NOT_FOUND_TEXT,
  save: POST_SAVE_FAILURE_WORDS,
};

export type FeedPostProps = {
  post: Post;
  session: Session | null;
  // This post's comment thread is the open one (one at a time, C3).
  open: boolean;
  // The comments button was pressed. The page opens or closes the thread.
  onToggleComments: (postId: number) => void;
  // The post left the list (deleted here, or found already gone). The page
  // moves focus to the list heading in an effect after that commit; nothing
  // here calls focus() while the dialog may still be open (ADV-004).
  onDeleted: (postId: number) => void;
  // Its comments answered 404: the post is gone. The page removes it and says so.
  onPostGone: (postId: number) => void;
};

/**
 * One post of the feed: byline, text, image, the comments button, and Edit
 * and Delete for those allowed (ADR-02). The open thread is drawn inside.
 */
export function FeedPost({
  post,
  session,
  open,
  onToggleComments,
  onDeleted,
  onPostGone,
}: FeedPostProps) {
  const savePost = useSetAtom(savePostAtom);
  const deletePost = useSetAtom(deletePostAtom);
  const showToast = useSetAtom(showToastAtom);

  const panelId = useId();
  const editRef = useRef<HTMLButtonElement>(null);

  const [editing, setEditing] = useState(false);
  // Raised when the edit form closes; the effect focuses Edit once it exists again.
  const [focusEditRequest, setFocusEditRequest] = useState(0);
  const [failedImage, setFailedImage] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  // Read after the delete answers: the dialog may have closed meanwhile.
  const confirmOpenRef = useRef(false);
  const deletingRef = useRef(false);

  useEffect(() => {
    if (focusEditRequest > 0 && !editing) {
      editRef.current?.focus();
    }
  }, [focusEditRequest, editing]);

  const mayEdit = canEditContent(session, post.user_id);
  const mayDelete = canDeleteContent(session, post.user_id);
  const authorName = displayName(post.name);
  const imageUrl =
    post.media_url !== null && isWebLink(post.media_url) && post.media_url !== failedImage
      ? post.media_url
      : null;

  function closeEdit() {
    setEditing(false);
    setFocusEditRequest((current) => current + 1);
  }

  async function handleSave(values: PostFormValues): Promise<FormResult> {
    const result = await savePost({
      id: post.id,
      caption: values.caption,
      media_url: values.mediaUrl,
    });
    if (result.ok) {
      closeEdit();
      showToast(POST_SAVED_TOAST);
      return { ok: true };
    }
    if (isGone(result.failure)) {
      // The store took the post off the list, so this form goes with it:
      // the words go to a toast, and focus to the list heading.
      showToast(POST_NOT_FOUND_TEXT);
      onDeleted(post.id);
    }
    return { ok: false, text: writeFailureText(result.failure, POST_WRITE_FAILURE_WORDS) };
  }

  function openConfirm() {
    setDeleteError(null);
    confirmOpenRef.current = true;
    setConfirmOpen(true);
  }

  // Cancel and Escape. Ignored while the delete runs, so its answer is always
  // seen inside the open dialog.
  function closeConfirm() {
    if (deletingRef.current) {
      return;
    }
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
    const result = await deletePost(post.id);
    deletingRef.current = false;
    setDeleting(false);

    if (result.ok || isGone(result.failure)) {
      // The store removed the post; this card and its dialog leave the page.
      confirmOpenRef.current = false;
      setConfirmOpen(false);
      showToast(result.ok ? POST_DELETED_TOAST : POST_NOT_FOUND_TEXT);
      onDeleted(post.id);
      return;
    }
    const text = writeFailureText(result.failure, POST_WRITE_FAILURE_WORDS);
    if (confirmOpenRef.current) {
      setDeleteError(text);
    } else {
      showToast(text);
    }
  }

  return (
    <Card as="article">
      <div className={styles.post}>
        <PostByline name={post.name} photoUrl={post.photo_url} createdAt={post.created_at} />

        {editing ? (
          <PostForm
            initialCaption={post.caption ?? ""}
            initialMediaUrl={post.media_url ?? ""}
            captionLabel={POST_EDIT_LABEL}
            submitLabel={SAVE_LABEL}
            busyLabel={SAVING_LABEL}
            primary={false}
            autoFocus
            onSubmit={handleSave}
            onCancel={closeEdit}
          />
        ) : (
          <>
            <PostText text={post.caption} />
            {imageUrl !== null ? (
              <img
                className={styles.image}
                src={imageUrl}
                alt={postImageAlt(authorName)}
                loading="lazy"
                onError={() => setFailedImage(imageUrl)}
              />
            ) : null}
          </>
        )}

        <div className={styles.footer}>
          <div className={styles.toggle}>
            <Button
              variant="quiet"
              aria-expanded={open}
              aria-controls={open ? panelId : undefined}
              onClick={() => onToggleComments(post.id)}
            >
              {commentCountText(post.comment_count)}
            </Button>
          </div>
          {!editing && (mayEdit || mayDelete) ? (
            <div className={styles.actions}>
              {mayEdit ? (
                <Button ref={editRef} variant="quiet" onClick={() => setEditing(true)}>
                  {EDIT_LABEL}
                </Button>
              ) : null}
              {mayDelete ? (
                <Button variant="quiet" tone="danger" onClick={openConfirm}>
                  {DELETE_LABEL}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>

        {open ? (
          <div className={styles.panel}>
            <CommentsPanel
              id={panelId}
              postId={post.id}
              session={session}
              onPostGone={onPostGone}
            />
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={closeConfirm}
        onConfirm={() => void handleConfirmDelete()}
        title={POST_DELETE_TITLE}
        confirmLabel={deleting ? DELETING_LABEL : POST_DELETE_CONFIRM}
        cancelLabel={CANCEL_LABEL}
        danger
        busy={deleting}
      >
        <div className={styles.dialogBody}>
          <p className={styles.dialogText}>{postDeleteBody(post.comment_count)}</p>
          {deleteError !== null ? <Message tone="error">{deleteError}</Message> : null}
        </div>
      </ConfirmDialog>
    </Card>
  );
}
