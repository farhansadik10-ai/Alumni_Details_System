import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "../../ui/Button/Button";
import { Message } from "../../ui/Message/Message";
import { Textarea } from "../../ui/Textarea/Textarea";
import { CANCEL_LABEL, commentReplyingTo } from "../../../config/text";
import { useFormError } from "../../../hooks/useFormError";
import { displayName } from "../../../lib/alumniDisplay";
import { validateComment } from "../../../lib/validation";
import type { FormResult } from "../PostForm/PostForm";
import styles from "./CommentForm.module.css";

// Two rows, so an edit of a longer comment has room (the design draws one line).
const COMMENT_ROWS = 2;

export type CommentFormProps = {
  // "Add a comment", or the edit label.
  label: string;
  initialValue?: string;
  submitLabel: string;
  // Shown on the submit button while the request runs, for example "Posting".
  busyLabel: string;
  // The name of the person being answered: shows "Replying to <name>".
  replyingTo?: string | null;
  // Given: a Cancel button is shown (an edit, or a reply).
  onCancel?: () => void;
  // The text as typed. The action trims it; the form does not (one trim rule).
  onSubmit: (content: string) => Promise<FormResult>;
  autoFocus?: boolean;
};

/**
 * Add, reply to and edit a comment (pattern 16). It has no API access: the
 * caller's onSubmit sends and answers. The submit is secondary, as drawn; the
 * ref is the text field, so the panel can move focus back to it.
 */
export const CommentForm = forwardRef<HTMLTextAreaElement | null, CommentFormProps>(
  function CommentForm(
    {
      label,
      initialValue = "",
      submitLabel,
      busyLabel,
      replyingTo,
      onCancel,
      onSubmit,
      autoFocus = false,
    },
    ref,
  ) {
    const [content, setContent] = useState(initialValue);
    const [error, setError] = useState<string | null>(null);
    const { formError, setFormError, formErrorRef, sending } = useFormError();
    const [busy, setBusy] = useState(false);

    const contentRef = useRef<HTMLTextAreaElement>(null);
    useImperativeHandle<HTMLTextAreaElement | null, HTMLTextAreaElement | null>(
      ref,
      () => contentRef.current,
      [],
    );

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      if (sending.current) {
        return;
      }

      const found = validateComment(content);
      setError(found);
      setFormError(null);
      if (found !== null) {
        contentRef.current?.focus();
        return;
      }

      sending.current = true;
      setBusy(true);
      const sent = content;
      const result = await onSubmit(sent);
      sending.current = false;
      setBusy(false);

      if (!result.ok) {
        // What the user typed stays in the field.
        setFormError({ text: result.text });
        return;
      }
      if (result.reset) {
        // Anything typed while the request ran is kept.
        setContent((current) => (current === sent ? "" : current));
        setError(null);
      }
    }

    return (
      <form className={styles.form} noValidate onSubmit={handleSubmit}>
        {replyingTo !== undefined && replyingTo !== null ? (
          <p className={styles.replying}>{commentReplyingTo(displayName(replyingTo))}</p>
        ) : null}

        {formError !== null ? (
          <Message ref={formErrorRef} tone="error">
            {formError.text}
          </Message>
        ) : null}

        <div className={styles.row}>
          <div className={styles.field}>
            <Textarea
              ref={contentRef}
              label={label}
              name="content"
              rows={COMMENT_ROWS}
              autoFocus={autoFocus}
              value={content}
              error={error}
              onChange={(event) => {
                setContent(event.target.value);
                setError(null);
              }}
            />
          </div>
          <div className={styles.buttons}>
            <Button type="submit" variant="secondary" busy={busy} busyLabel={busyLabel}>
              {submitLabel}
            </Button>
            {onCancel ? <Button onClick={onCancel}>{CANCEL_LABEL}</Button> : null}
          </div>
        </div>
      </form>
    );
  },
);
