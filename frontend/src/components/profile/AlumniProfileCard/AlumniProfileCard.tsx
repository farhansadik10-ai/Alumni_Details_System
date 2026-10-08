import { useAtomValue, useSetAtom } from "jotai";
import type { Alumni } from "@alumni/shared";
import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent, MouseEvent } from "react";
import { Button } from "../../ui/Button/Button";
import { Card } from "../../ui/Card/Card";
import { Checkbox } from "../../ui/Checkbox/Checkbox";
import { ErrorState } from "../../ui/ErrorState/ErrorState";
import { Message } from "../../ui/Message/Message";
import { Skeleton, SkeletonGroup } from "../../ui/Skeleton/Skeleton";
import { Textarea } from "../../ui/Textarea/Textarea";
import { TextInput } from "../../ui/TextInput/TextInput";
import {
  ALUMNI_BIO_LABEL,
  ALUMNI_CARD_HEADING,
  ALUMNI_CARD_INTRO,
  ALUMNI_COMPANY_LABEL,
  ALUMNI_DEPARTMENT_LABEL,
  ALUMNI_DISCARD_BUTTON,
  ALUMNI_EXPERIENCE_LABEL,
  ALUMNI_FIELD_LABEL,
  ALUMNI_JOB_TITLE_LABEL,
  ALUMNI_LINKEDIN_LABEL,
  ALUMNI_LOAD_ERROR_HEADING,
  ALUMNI_MENTORING_LABEL,
  ALUMNI_SAVED_TOAST,
  ALUMNI_SAVE_BUTTON,
  ALUMNI_YEAR_LABEL,
  OPTIONAL_MARK,
  SAVE_FAILED_CONFLICT,
  SAVE_FAILED_GONE,
  SAVE_FAILED_GONE_RETRY,
  SAVE_FAILED_NO_ANSWER,
  SAVE_FAILED_SERVER,
} from "../../../config/text";
import { useFormError } from "../../../hooks/useFormError";
import {
  alumniToForm,
  canSaveAlumniForm,
  firstInvalidField,
  sameAlumniForm,
  validateAlumniForm,
} from "../../../lib/alumniForm";
import type {
  AlumniFormErrors,
  AlumniFormField,
  AlumniFormValues,
} from "../../../lib/alumniForm";
import { loadFailureText } from "../../../lib/loadFailure";
import { saveFailureReason, saveFailureText } from "../../../lib/saveFailure";
import type { SaveFailureWords } from "../../../lib/saveFailure";
import { GENERAL_ERROR_MESSAGE } from "../../../lib/validation";
import { saveAlumniProfileAtom } from "../../../store/alumniActions";
import { loadMyAlumniAtom, myAlumniAtom } from "../../../store/alumniAtoms";
import { showToastAtom } from "../../../store/toastAtoms";
import styles from "./AlumniProfileCard.module.css";

// A 409 on create has its own words: the profile was reloaded into the form.
const SAVE_FAILURE_WORDS: SaveFailureWords = {
  noAnswer: SAVE_FAILED_NO_ANSWER,
  server: SAVE_FAILED_SERVER,
  gone: SAVE_FAILED_GONE,
  conflict: SAVE_FAILED_CONFLICT,
  general: GENERAL_ERROR_MESSAGE,
};

const NO_ERRORS: AlumniFormErrors = {};

const BIO_ROWS = 4;

type TextField = Exclude<AlumniFormField, "mentoring">;

/** The card-level message of a failed save; `gone` adds the reload button. */
type SaveFailureMessage = {
  text: string;
  gone: boolean;
};

/**
 * The Alumni profile card of My profile, for the alumni and admin roles:
 * the form creates the profile the first time and edits it after.
 *
 * The page keys this card on the session's user id, and on nothing else.
 * The form is the same element whether the user has a profile or not, so
 * it stays mounted when a profile appears (after the first create, or the
 * reload after a 409): the values are reset in place, the failure message
 * stays and keyboard focus stays where it was (ADV-002).
 */
export function AlumniProfileCard() {
  const mine = useAtomValue(myAlumniAtom);
  const loadMyAlumni = useSetAtom(loadMyAlumniAtom);
  const saveProfile = useSetAtom(saveAlumniProfileAtom);
  const showToast = useSetAtom(showToastAtom);
  const headingId = useId();

  const [values, setValues] = useState<AlumniFormValues>(() => alumniToForm(mine.alumni));
  const [errors, setErrors] = useState<AlumniFormErrors>(NO_ERRORS);
  // Its own message and guard, so a failure here never touches the Account card.
  const { formError, setFormError, formErrorRef, sending } = useFormError();
  const [gone, setGone] = useState(false);
  const [busy, setBusy] = useState(false);
  const fieldRefs = useRef<Partial<Record<AlumniFormField, HTMLElement | null>>>({});
  const headingRef = useRef<HTMLHeadingElement>(null);
  const saveRef = useRef<HTMLButtonElement>(null);

  // The values the running (or last) save sent; null when no save is waiting
  // for the store to take its answer.
  const [sent, setSent] = useState<AlumniFormValues | null>(null);
  // The values as typed after the last render, for the end of a save.
  const latestValues = useRef(values);
  useEffect(() => {
    latestValues.current = values;
  });

  // The saved profile the form was last filled from. When the store holds
  // another one (a load, a save, the reload after a 409), the values are
  // reset in place during render, so no frame shows the old values. Text
  // typed while a save ran is kept: the reset happens only when the form
  // still holds what was sent (CORR-005).
  const [filledFrom, setFilledFrom] = useState<Alumni | null>(mine.alumni);
  if (mine.alumni !== filledFrom) {
    setFilledFrom(mine.alumni);
    if (sent === null || sameAlumniForm(values, sent)) {
      setValues(alumniToForm(mine.alumni));
      setErrors(NO_ERRORS);
    }
    setSent(null);
  }

  // Discard changes is off until a value differs from the saved one
  // (UI-001). Save is off on the same rule, except with no profile yet:
  // then the save creates it, even from the empty form (AC24, R2-001).
  const saved = alumniToForm(mine.alumni);
  const changed = !sameAlumniForm(values, saved);
  const canSave = canSaveAlumniForm(mine.status === "none", values, saved);

  useEffect(() => {
    void loadMyAlumni();
  }, [loadMyAlumni]);

  // A button about to be switched off would drop keyboard focus to the
  // page; the card heading takes it instead.
  function keepFocusFrom(button: HTMLElement | null) {
    if (button !== null && document.activeElement === button) {
      headingRef.current?.focus();
    }
  }

  // "Try again" goes away with the error state: focus moves to the heading,
  // which stays the same element in every status.
  function handleRetryLoad() {
    void loadMyAlumni();
    headingRef.current?.focus();
  }

  function register(field: AlumniFormField) {
    return (element: HTMLElement | null) => {
      fieldRefs.current[field] = element;
    };
  }

  function setText(field: TextField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (current[field] === undefined) {
        return current;
      }
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function showFailure(message: SaveFailureMessage | null) {
    setFormError(message === null ? null : { text: message.text });
    setGone(message?.gone ?? false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current || !canSave) {
      return;
    }

    // Old stored data can break the limits (ADV-008): each such field gets
    // its own message here, like a typed value would.
    const found = validateAlumniForm(values, new Date().getFullYear());
    setErrors(found);
    showFailure(null);
    const first = firstInvalidField(found);
    if (first !== null) {
      fieldRefs.current[first]?.focus();
      return;
    }

    sending.current = true;
    setBusy(true);
    setSent(values);

    // A create or an edit, chosen by the store. After a 409 the store has
    // already reloaded the profile, so the form shows it before the message.
    // The fields stay editable while it runs; the store's answer resets them
    // only if they still hold what was sent (see filledFrom above).
    const result = await saveProfile(values);
    sending.current = false;
    setBusy(false);

    if (result.ok) {
      if (sameAlumniForm(latestValues.current, values)) {
        keepFocusFrom(saveRef.current);
      }
      showToast(ALUMNI_SAVED_TOAST);
      return;
    }
    // What the user typed stays in the fields.
    showFailure({
      text: saveFailureText(result.failure, SAVE_FAILURE_WORDS),
      gone: saveFailureReason(result.failure) === "gone",
    });
  }

  // Back to the last saved values, or empty; no question, no request (AC29).
  function handleDiscard(event: MouseEvent<HTMLButtonElement>) {
    keepFocusFrom(event.currentTarget);
    setValues(alumniToForm(mine.alumni));
    setErrors(NO_ERRORS);
    setSent(null);
    showFailure(null);
  }

  function handleReload() {
    showFailure(null);
    setSent(null);
    void loadMyAlumni();
  }

  let body;
  if (mine.status === "ready" || mine.status === "none") {
    body = (
      <form className={styles.form} noValidate onSubmit={handleSubmit}>
        {formError !== null ? (
          <div className={styles.failure}>
            <Message ref={formErrorRef} tone="error">
              {formError.text}
            </Message>
            {gone ? (
              <div className={styles.failureAction}>
                <Button onClick={handleReload}>{SAVE_FAILED_GONE_RETRY}</Button>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className={styles.grid}>
          <TextInput
            ref={register("department")}
            label={ALUMNI_DEPARTMENT_LABEL}
            name="department"
            value={values.department}
            error={errors.department}
            onChange={(event) => setText("department", event.target.value)}
          />
          <TextInput
            ref={register("graduationYear")}
            label={ALUMNI_YEAR_LABEL}
            name="graduationYear"
            inputMode="numeric"
            value={values.graduationYear}
            error={errors.graduationYear}
            onChange={(event) => setText("graduationYear", event.target.value)}
          />
          <TextInput
            ref={register("field")}
            label={ALUMNI_FIELD_LABEL}
            name="field"
            value={values.field}
            error={errors.field}
            onChange={(event) => setText("field", event.target.value)}
          />
          <TextInput
            ref={register("company")}
            label={ALUMNI_COMPANY_LABEL}
            name="company"
            autoComplete="organization"
            value={values.company}
            error={errors.company}
            onChange={(event) => setText("company", event.target.value)}
          />
          <TextInput
            ref={register("jobTitle")}
            label={ALUMNI_JOB_TITLE_LABEL}
            name="jobTitle"
            autoComplete="organization-title"
            value={values.jobTitle}
            error={errors.jobTitle}
            onChange={(event) => setText("jobTitle", event.target.value)}
          />
          <TextInput
            ref={register("experience")}
            label={ALUMNI_EXPERIENCE_LABEL}
            name="experience"
            value={values.experience}
            error={errors.experience}
            onChange={(event) => setText("experience", event.target.value)}
          />
        </div>

        <TextInput
          ref={register("linkedinUrl")}
          label={ALUMNI_LINKEDIN_LABEL}
          optionalNote={OPTIONAL_MARK}
          type="url"
          name="linkedinUrl"
          autoComplete="url"
          value={values.linkedinUrl}
          error={errors.linkedinUrl}
          onChange={(event) => setText("linkedinUrl", event.target.value)}
        />
        <Textarea
          ref={register("bio")}
          label={ALUMNI_BIO_LABEL}
          name="bio"
          rows={BIO_ROWS}
          value={values.bio}
          error={errors.bio}
          onChange={(event) => setText("bio", event.target.value)}
        />
        <Checkbox
          ref={register("mentoring")}
          boxed
          label={ALUMNI_MENTORING_LABEL}
          name="mentoring"
          checked={values.mentoring}
          onChange={(event) => {
            const { checked } = event.target;
            setValues((current) => ({ ...current, mentoring: checked }));
          }}
        />

        <div className={styles.actions}>
          <Button
            ref={saveRef}
            type="submit"
            variant="primary"
            busy={busy}
            disabled={!canSave && !busy}
          >
            {ALUMNI_SAVE_BUTTON}
          </Button>
          {/* Off while a save runs: its answer would refill the form (R2-002). */}
          <Button disabled={!changed || busy} onClick={handleDiscard}>
            {ALUMNI_DISCARD_BUTTON}
          </Button>
        </div>
      </form>
    );
  } else if (mine.status === "error") {
    // No form: a save must not overwrite a profile that failed to load (AC31).
    body = (
      <ErrorState
        heading={ALUMNI_LOAD_ERROR_HEADING}
        headingAs="h3"
        text={loadFailureText(mine.failure)}
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
        <Skeleton />
        <Skeleton shape="block" />
      </SkeletonGroup>
    );
  }

  return (
    <Card as="section" padding="lg" aria-labelledby={headingId}>
      <div className={styles.card}>
        <div className={styles.top}>
          <h2 ref={headingRef} id={headingId} className={styles.heading} tabIndex={-1}>
            {ALUMNI_CARD_HEADING}
          </h2>
          <p className={styles.intro}>{ALUMNI_CARD_INTRO}</p>
        </div>
        {body}
      </div>
    </Card>
  );
}
