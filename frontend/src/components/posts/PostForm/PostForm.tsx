import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "../../ui/Button/Button";
import { Message } from "../../ui/Message/Message";
import { TextInput } from "../../ui/TextInput/TextInput";
import { Textarea } from "../../ui/Textarea/Textarea";
import {
  CANCEL_LABEL,
  POST_CAPTION_PLACEHOLDER,
  POST_IMAGE_LABEL,
  POST_IMAGE_OPTIONAL,
  POST_IMAGE_PLACEHOLDER,
} from "../../../config/text";
import { useFormError } from "../../../hooks/useFormError";
import { validateCaption, validatePhotoLink } from "../../../lib/validation";
import styles from "./PostForm.module.css";

/**
 * What a form's onSubmit answers. ok with reset empties the form (a new post
 * or comment); ok without it leaves the values (the caller closes an edit).
 * Not ok shows the words above the buttons and keeps what was typed.
 */
export type FormResult = { ok: true; reset?: boolean } | { ok: false; text: string };

// As typed. The action trims them; the form does not (one trim rule).
export type PostFormValues = {
  caption: string;
  mediaUrl: string;
};

export type PostFormProps = {
  initialCaption?: string;
  initialMediaUrl?: string;
  // The caption field's label: "Write a post" or "Edit post".
  captionLabel: string;
  submitLabel: string;
  // Shown on the submit button while the request runs, for example "Publishing".
  busyLabel: string;
  // The submit is the one primary button of the view. Pass false when another
  // primary button is on screen (an edit form under the "Write a post" form).
  primary?: boolean;
  onSubmit: (values: PostFormValues) => Promise<FormResult>;
  // Given: a Cancel button is shown.
  onCancel?: () => void;
  autoFocus?: boolean;
};

type FieldErrors = {
  caption: string | null;
  mediaUrl: string | null;
};

const NO_ERRORS: FieldErrors = { caption: null, mediaUrl: null };

/**
 * "Write a post" and "Edit post" (pattern 16). It has no API access: the
 * caller's onSubmit sends and answers. The ref is the caption field, so a
 * page can move focus there after a publish.
 */
export const PostForm = forwardRef<HTMLTextAreaElement | null, PostFormProps>(function PostForm(
  {
    initialCaption = "",
    initialMediaUrl = "",
    captionLabel,
    submitLabel,
    busyLabel,
    primary = true,
    onSubmit,
    onCancel,
    autoFocus = false,
  },
  ref,
) {
  const [caption, setCaption] = useState(initialCaption);
  const [mediaUrl, setMediaUrl] = useState(initialMediaUrl);
  const [errors, setErrors] = useState<FieldErrors>(NO_ERRORS);
  const { formError, setFormError, formErrorRef, sending } = useFormError();
  const [busy, setBusy] = useState(false);

  const captionRef = useRef<HTMLTextAreaElement>(null);
  const mediaUrlRef = useRef<HTMLInputElement>(null);
  useImperativeHandle<HTMLTextAreaElement | null, HTMLTextAreaElement | null>(
    ref,
    () => captionRef.current,
    [],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current) {
      return;
    }

    const found: FieldErrors = {
      caption: validateCaption(caption),
      mediaUrl: validatePhotoLink(mediaUrl),
    };
    setErrors(found);
    setFormError(null);
    if (found.caption !== null) {
      captionRef.current?.focus();
      return;
    }
    if (found.mediaUrl !== null) {
      mediaUrlRef.current?.focus();
      return;
    }

    sending.current = true;
    setBusy(true);
    const sent: PostFormValues = { caption, mediaUrl };
    const result = await onSubmit(sent);
    sending.current = false;
    setBusy(false);

    if (!result.ok) {
      // What the user typed stays in the fields.
      setFormError({ text: result.text });
      return;
    }
    if (result.reset) {
      // The fields stay editable while the request runs: anything typed
      // meanwhile is kept.
      setCaption((current) => (current === sent.caption ? "" : current));
      setMediaUrl((current) => (current === sent.mediaUrl ? "" : current));
      setErrors(NO_ERRORS);
    }
  }

  return (
    <form className={styles.form} noValidate onSubmit={handleSubmit}>
      <Textarea
        ref={captionRef}
        label={captionLabel}
        name="caption"
        rows={3}
        placeholder={POST_CAPTION_PLACEHOLDER}
        autoFocus={autoFocus}
        value={caption}
        error={errors.caption}
        onChange={(event) => {
          setCaption(event.target.value);
          setErrors((current) => ({ ...current, caption: null }));
        }}
      />

      {formError !== null ? (
        <Message ref={formErrorRef} tone="error">
          {formError.text}
        </Message>
      ) : null}

      <div className={styles.row}>
        <div className={styles.imageField}>
          <TextInput
            ref={mediaUrlRef}
            label={POST_IMAGE_LABEL}
            optionalNote={POST_IMAGE_OPTIONAL}
            type="url"
            name="mediaUrl"
            placeholder={POST_IMAGE_PLACEHOLDER}
            value={mediaUrl}
            error={errors.mediaUrl}
            onChange={(event) => {
              setMediaUrl(event.target.value);
              setErrors((current) => ({ ...current, mediaUrl: null }));
            }}
          />
        </div>
        <div className={styles.buttons}>
          <Button
            type="submit"
            variant={primary ? "primary" : "secondary"}
            busy={busy}
            busyLabel={busyLabel}
          >
            {submitLabel}
          </Button>
          {/* Ignored while the save runs (busy keeps it focusable), so the
              answer never lands on a closed edit (pattern 32, trap 3). */}
          {onCancel ? (
            <Button busy={busy} onClick={onCancel}>
              {CANCEL_LABEL}
            </Button>
          ) : null}
        </div>
      </div>
    </form>
  );
});
