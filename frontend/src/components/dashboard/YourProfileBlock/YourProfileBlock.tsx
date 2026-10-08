import { useId } from "react";
import {
  DASHBOARD_PROFILE_EDIT_LINK,
  DASHBOARD_PROFILE_ERROR_HEADING,
  DASHBOARD_PROFILE_HEADING,
  DASHBOARD_PROFILE_NONE_HEADING,
  DASHBOARD_PROFILE_NONE_LINK,
  DASHBOARD_PROFILE_NONE_TEXT,
  DASHBOARD_PROFILE_STUDENT_HEADING,
  DASHBOARD_PROFILE_STUDENT_LINK,
  DASHBOARD_PROFILE_STUDENT_TEXT,
} from "../../../config/text";
import { displayName, jobLine, presentText } from "../../../lib/alumniDisplay";
import { loadFailureText } from "../../../lib/loadFailure";
import { canWritePosts } from "../../../lib/token";
import type { Role } from "../../../lib/token";
import { PATHS } from "../../../routes/paths";
import type { MyAlumniState } from "../../../store/alumniAtoms";
import { Avatar } from "../../ui/Avatar/Avatar";
import { ButtonLink } from "../../ui/ButtonLink/ButtonLink";
import { Card } from "../../ui/Card/Card";
import { ErrorState } from "../../ui/ErrorState/ErrorState";
import { Skeleton, SkeletonGroup, SkeletonStack } from "../../ui/Skeleton/Skeleton";
import styles from "./YourProfileBlock.module.css";

export type YourProfileBlockProps = {
  // The session's role. Only alumni and admin have an alumni profile; anyone
  // else gets the "complete your account" prompt and `state` is not read.
  role: Role | null;
  // The `myAlumniAtom` state. The page loads it for alumni and admin only.
  state: MyAlumniState;
  // The account's name and photo, used when the profile carries none.
  userName: string | null;
  userPhoto: string | null;
  onRetry: () => void;
};

/** A prompt in a card: a heading, a line and a link to My profile. */
function Prompt({ heading, text, linkLabel }: { heading: string; text: string; linkLabel: string }) {
  return (
    <Card>
      <div className={styles.card}>
        <h3 className={styles.promptHeading}>{heading}</h3>
        <p className={styles.promptText}>{text}</p>
        <div>
          <ButtonLink to={PATHS.myProfile} variant="secondary">
            {linkLabel}
          </ButtonLink>
        </div>
      </div>
    </Card>
  );
}

/**
 * "Your profile" on the Dashboard (dashboard.html). Alumni and admin see their
 * profile in short, a prompt to create one, or an error with retry. A student
 * sees a prompt to complete the account, and nothing is loaded for them.
 */
export function YourProfileBlock({ role, state, userName, userPhoto, onRetry }: YourProfileBlockProps) {
  const headingId = useId();

  let body;
  // Those who may post are the ones with an alumni profile (ADR-02).
  if (!canWritePosts(role)) {
    body = (
      <Prompt
        heading={DASHBOARD_PROFILE_STUDENT_HEADING}
        text={DASHBOARD_PROFILE_STUDENT_TEXT}
        linkLabel={DASHBOARD_PROFILE_STUDENT_LINK}
      />
    );
  } else if (state.status === "ready" && state.alumni !== null) {
    const { alumni } = state;
    const name = presentText(alumni.name) ?? userName;
    const photo = presentText(alumni.photo_url) ?? userPhoto;
    const job = jobLine(alumni.job_title, alumni.current_company);
    body = (
      <Card>
        <div className={styles.card}>
          <div className={styles.who}>
            <Avatar name={name} photoUrl={photo} size="md" />
            <div className={styles.lines}>
              <p className={styles.name}>{displayName(name)}</p>
              {job !== null ? <p className={styles.job}>{job}</p> : null}
            </div>
          </div>
          <div>
            <ButtonLink to={PATHS.myProfile} variant="secondary">
              {DASHBOARD_PROFILE_EDIT_LINK}
            </ButtonLink>
          </div>
        </div>
      </Card>
    );
  } else if (state.status === "none") {
    body = (
      <Prompt
        heading={DASHBOARD_PROFILE_NONE_HEADING}
        text={DASHBOARD_PROFILE_NONE_TEXT}
        linkLabel={DASHBOARD_PROFILE_NONE_LINK}
      />
    );
  } else if (state.status === "error") {
    body = (
      <ErrorState
        heading={DASHBOARD_PROFILE_ERROR_HEADING}
        headingAs="h3"
        text={loadFailureText(state.failure)}
        retryVariant="secondary"
        onRetry={onRetry}
      />
    );
  } else {
    // idle or loading (or ready without a profile, which the store never sends).
    body = (
      <Card>
        <SkeletonGroup layout="row">
          <Skeleton shape="avatar-md" />
          <SkeletonStack>
            <Skeleton shape="title" />
            <Skeleton shape="line" />
          </SkeletonStack>
        </SkeletonGroup>
      </Card>
    );
  }

  return (
    <section className={styles.block} aria-labelledby={headingId}>
      <h2 id={headingId} className={styles.heading}>
        {DASHBOARD_PROFILE_HEADING}
      </h2>
      {body}
    </section>
  );
}
