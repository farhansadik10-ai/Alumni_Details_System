import { useAtomValue, useSetAtom } from "jotai";
import type { PublicUser } from "@alumni/shared";
import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent, RefObject } from "react";
import { Button } from "../../ui/Button/Button";
import { Card } from "../../ui/Card/Card";
import { ErrorState } from "../../ui/ErrorState/ErrorState";
import { Message } from "../../ui/Message/Message";
import { Skeleton, SkeletonGroup } from "../../ui/Skeleton/Skeleton";
import { RoleTag } from "../../ui/Tag/RoleTag";
import { TextInput } from "../../ui/TextInput/TextInput";
import {
  ACCOUNT_CARD_HEADING,
  ACCOUNT_EMAIL_HELP,
  ACCOUNT_EMAIL_LABEL,
  ACCOUNT_LOAD_ERROR_HEADING,
  ACCOUNT_LOG_OUT_BUTTON,
  ACCOUNT_NAME_LABEL,
  ACCOUNT_PHOTO_HELP,
  ACCOUNT_PHOTO_LABEL,
  ACCOUNT_PHOTO_PLACEHOLDER,
  ACCOUNT_ROLE_LABEL,
  ACCOUNT_SAVED_TOAST,
  ACCOUNT_SAVE_BUTTON,
  ACCOUNT_SAVE_FAILED_GONE,
  OPTIONAL_MARK,
  SAVE_FAILED_NO_ANSWER,
  SAVE_FAILED_SERVER,
} from "../../../config/text";
import { useFormError } from "../../../hooks/useFormError";
import { sameText } from "../../../lib/alumniDisplay";
import { loadFailureText } from "../../../lib/loadFailure";
import { saveFailureText } from "../../../lib/saveFailure";
import type { SaveFailureWords } from "../../../lib/saveFailure";
import { GENERAL_ERROR_MESSAGE, validateName, validatePhotoLink } from "../../../lib/validation";
import { saveAccountAtom } from "../../../store/alumniActions";
import { loadProfileAtom, profileAtom } from "../../../store/profileAtoms";
import { logOutAtom } from "../../../store/sessionActions";
import { showToastAtom } from "../../../store/toastAtoms";
import styles from "./AccountCard.module.css";

// The Account card has no conflict case: the email is never sent. A 403 or
// 404 talks about the account, not a profile.
const SAVE_FAILURE_WORDS: SaveFailureWords = {
  noAnswer: SAVE_FAILED_NO_ANSWER,
  server: SAVE_FAILED_SERVER,
  gone: ACCOUNT_SAVE_FAILED_GONE,
  general: GENERAL_ERROR_MESSAGE,
};

type FieldErrors = {
  name: string | null;
  photoUrl: string | null;
};

const NO_ERRORS: FieldErrors = { name: null, photoUrl: null };

export type AccountCardProps = {
  // "Save account" is the page's primary button only when no other card has
  // one (a student's page). With the Alumni profile card it is secondary,
  // as drawn: one primary button per view.
  primary?: boolean;
};

/**
 * The Account card of My profile, for every role: the name and photo link
 * can be edited, the email and role are shown, and the user can log out.
 * It reads the header's profile, so a save shows in the header at once.
 */
export function AccountCard({ primary = true }: AccountCardProps) {
  const profile = useAtomValue(profileAtom);
  const loadProfile = useSetAtom(loadProfileAtom);
  const headingId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);

  // "Try again" goes away with the error state: focus moves to the heading,
  // which stays the same element in every status.
  function handleRetryLoad() {
    void loadProfile();
    headingRef.current?.focus();
  }

  let body;
  if (profile.status === "ready" && profile.user !== null) {
    // Keyed on the user: another user's values never stay in the fields.
    body = (
      <AccountForm
        key={profile.user.id}
        user={profile.user}
        primary={primary}
        headingRef={headingRef}
      />
    );
  } else if (profile.status === "error") {
    // The profile call does not keep its failure (null), so the shared rule
    // gives the no-answer words.
    body = (
      <ErrorState
        heading={ACCOUNT_LOAD_ERROR_HEADING}
        headingAs="h3"
        text={loadFailureText(null)}
        retryVariant="secondary"
        onRetry={handleRetryLoad}
      />
    );
  } else {
    body = (
      <SkeletonGroup>
        <Skeleton />
        <Skeleton shape="block" />
        <Skeleton />
        <Skeleton shape="block" />
      </SkeletonGroup>
    );
  }

  return (
    <Card as="section" padding="lg" aria-labelledby={headingId}>
      <div className={styles.card}>
        <h2 ref={headingRef} id={headingId} className={styles.heading} tabIndex={-1}>
          {ACCOUNT_CARD_HEADING}
        </h2>
        {body}
      </div>
    </Card>
  );
}

type AccountFormProps = {
  user: PublicUser;
  primary: boolean;
  // Takes keyboard focus when the save button is switched off under it.
  headingRef: RefObject<HTMLHeadingElement>;
};

function AccountForm({ user, primary, headingRef }: AccountFormProps) {
  const saveAccount = useSetAtom(saveAccountAtom);
  const showToast = useSetAtom(showToastAtom);
  const logOut = useSetAtom(logOutAtom);

  const [name, setName] = useState(user.name ?? "");
  const [photoUrl, setPhotoUrl] = useState(user.photo_url ?? "");
  const [errors, setErrors] = useState<FieldErrors>(NO_ERRORS);
  const { formError, setFormError, formErrorRef, sending } = useFormError();
  const [busy, setBusy] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const saveRef = useRef<HTMLButtonElement>(null);

  // The values as typed after the last render, for the end of a save.
  const latest = useRef({ name, photoUrl });
  useEffect(() => {
    latest.current = { name, photoUrl };
  });

  // The saved user is the store's, so after a save the form is unchanged
  // again. Save is off until a value differs, so a save always changes
  // something (UI-001).
  const changed =
    !sameText(name, user.name ?? "") || !sameText(photoUrl, user.photo_url ?? "");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current || !changed) {
      return;
    }

    const found: FieldErrors = {
      name: validateName(name),
      photoUrl: validatePhotoLink(photoUrl),
    };
    setErrors(found);
    setFormError(null);
    if (found.name !== null) {
      nameRef.current?.focus();
      return;
    }
    if (found.photoUrl !== null) {
      photoRef.current?.focus();
      return;
    }

    sending.current = true;
    setBusy(true);

    // The action trims both values and never sends the email.
    // The fields stay editable while it runs. A field is reset to the saved
    // answer only if it still holds what was sent, so newer typing is kept
    // (CORR-005).
    const sent = { name, photoUrl };
    const result = await saveAccount(sent);
    sending.current = false;
    setBusy(false);

    if (result.ok) {
      const savedName = result.user.name ?? "";
      const savedPhotoUrl = result.user.photo_url ?? "";
      const nameAsSent = sameText(latest.current.name, sent.name);
      const photoAsSent = sameText(latest.current.photoUrl, sent.photoUrl);
      setName((current) => (sameText(current, sent.name) ? savedName : current));
      setPhotoUrl((current) => (sameText(current, sent.photoUrl) ? savedPhotoUrl : current));
      // Nothing typed meanwhile: the button is about to be switched off.
      if (nameAsSent && photoAsSent && document.activeElement === saveRef.current) {
        headingRef.current?.focus();
      }
      showToast(ACCOUNT_SAVED_TOAST);
      return;
    }
    // What the user typed stays in the fields.
    setFormError({ text: saveFailureText(result.failure, SAVE_FAILURE_WORDS) });
  }

  // The route guard sends the user to log in when the session is gone, and
  // this card leaves with the page. Nothing navigates here (pattern 11).
  function handleLogOut() {
    setLoggingOut(true);
    void logOut();
  }

  return (
    <form className={styles.form} noValidate onSubmit={handleSubmit}>
      {formError !== null ? (
        <Message ref={formErrorRef} tone="error">
          {formError.text}
        </Message>
      ) : null}

      <TextInput
        ref={nameRef}
        label={ACCOUNT_NAME_LABEL}
        name="name"
        autoComplete="name"
        value={name}
        error={errors.name}
        onChange={(event) => {
          setName(event.target.value);
          setErrors((current) => ({ ...current, name: null }));
        }}
      />
      <TextInput
        label={ACCOUNT_EMAIL_LABEL}
        type="email"
        name="email"
        value={user.email}
        help={ACCOUNT_EMAIL_HELP}
        disabled
        readOnly
      />
      <div className={styles.role}>
        <span className={styles.roleLabel}>{ACCOUNT_ROLE_LABEL}</span>
        <RoleTag role={user.role} />
      </div>
      <TextInput
        ref={photoRef}
        label={ACCOUNT_PHOTO_LABEL}
        optionalNote={OPTIONAL_MARK}
        type="url"
        name="photoUrl"
        autoComplete="photo"
        placeholder={ACCOUNT_PHOTO_PLACEHOLDER}
        value={photoUrl}
        help={ACCOUNT_PHOTO_HELP}
        error={errors.photoUrl}
        onChange={(event) => {
          setPhotoUrl(event.target.value);
          setErrors((current) => ({ ...current, photoUrl: null }));
        }}
      />

      <div className={styles.save}>
        <Button
          ref={saveRef}
          type="submit"
          variant={primary ? "primary" : "secondary"}
          busy={busy}
          disabled={!changed && !busy}
        >
          {ACCOUNT_SAVE_BUTTON}
        </Button>
      </div>

      <div className={styles.logOut}>
        <Button busy={loggingOut} onClick={handleLogOut}>
          {ACCOUNT_LOG_OUT_BUTTON}
        </Button>
      </div>
    </form>
  );
}
