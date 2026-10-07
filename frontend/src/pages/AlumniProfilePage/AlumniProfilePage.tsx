import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useId, useRef } from "react";
import { useLocation, useParams } from "react-router-dom";
import type { Alumni } from "@alumni/shared";
import { PageLayout, PageNote } from "../../components/shell/PageLayout/PageLayout";
import {
  ProfileBand,
  ProfileBandAction,
} from "../../components/shell/ProfileBand/ProfileBand";
import { Card } from "../../components/ui/Card/Card";
import { ErrorState } from "../../components/ui/ErrorState/ErrorState";
import { Link } from "../../components/ui/Link/Link";
import { Skeleton, SkeletonGroup } from "../../components/ui/Skeleton/Skeleton";
import { Tag } from "../../components/ui/Tag/Tag";
import {
  NOT_GIVEN,
  OPEN_TO_MENTORING,
  OPENS_IN_NEW_TAB,
  PROFILE_ABOUT_HEADING,
  PROFILE_BACK_LINK,
  PROFILE_COMPANY_LABEL,
  PROFILE_DEPARTMENT_LABEL,
  PROFILE_DETAILS_HEADING,
  PROFILE_EMAIL_LABEL,
  PROFILE_ERROR_HEADING,
  PROFILE_EXPERIENCE_LABEL,
  PROFILE_FIELD_LABEL,
  PROFILE_HEADING,
  PROFILE_JOB_TITLE_LABEL,
  PROFILE_LINKEDIN_LINK,
  PROFILE_MENTORING_LABEL,
  PROFILE_MENTORING_NO,
  PROFILE_MENTORING_YES,
  PROFILE_NOT_FOUND_HEADING,
  PROFILE_NOT_FOUND_LINK,
  PROFILE_NOT_FOUND_TEXT,
  PROFILE_YEAR_LABEL,
  profileEmailLink,
} from "../../config/text";
import {
  classLabel,
  displayName,
  firstName,
  jobLine,
  orNotGiven,
  presentText,
} from "../../lib/alumniDisplay";
import { readDirectorySearch } from "../../lib/directoryReturn";
import { loadFailureText } from "../../lib/loadFailure";
import { readProfileId } from "../../lib/profileId";
import { isWebLink } from "../../lib/validation";
import { PATHS } from "../../routes/paths";
import { loadAlumniAtom, viewedAlumniAtom } from "../../store/alumniAtoms";
import styles from "./AlumniProfilePage.module.css";

// How many lines the Details skeleton draws: one per row of the card.
const DETAILS_ROW_COUNT = 8;

type PageStatus = "loading" | "ready" | "notFound" | "error";

/**
 * One person's public profile (AC15 to AC20). The band is drawn in every
 * status at the same place, so its <h1> stays the same element when the data
 * arrives and keyboard focus on it is not lost.
 */
export default function AlumniProfilePage() {
  const { id: rawId } = useParams();
  const location = useLocation();
  const id = readProfileId(rawId);
  const viewed = useAtomValue(viewedAlumniAtom);
  const loadAlumni = useSetAtom(loadAlumniAtom);
  const bandRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id !== null) {
      void loadAlumni(id);
    }
  }, [id, loadAlumni]);

  // The atom may still hold another profile: it counts only when its id is
  // this page's id (TASK-005).
  let status: PageStatus;
  if (id === null) {
    status = "notFound";
  } else if (viewed.id !== id || viewed.status === "idle" || viewed.status === "loading") {
    status = "loading";
  } else {
    status = viewed.status;
  }
  const alumni = status === "ready" ? viewed.alumni : null;

  // Back to the same filters and page; the plain directory when the state
  // is missing or not trusted (AC17).
  const backTo = PATHS.directory + readDirectorySearch(location.state);
  const heading = alumni ? displayName(alumni.name) : PROFILE_HEADING;

  function retryProfile(profileId: number) {
    void loadAlumni(profileId);
    // "Try again" goes away with the error state: focus moves to the band's
    // <h1>, which stays the same element in every status, not to the body.
    bandRef.current?.querySelector<HTMLElement>("h1")?.focus();
  }

  return (
    <PageLayout
      heading={heading}
      band={
        <div ref={bandRef}>
          <ProfileBand
            back={{ to: backTo, label: PROFILE_BACK_LINK }}
            avatar={{ name: alumni?.name ?? null, photoUrl: alumni?.photo_url ?? null }}
            heading={heading}
            loading={status === "loading"}
            {...(alumni ? bandDetails(alumni) : {})}
          />
        </div>
      }
    >
      {status === "loading" ? <ProfileSkeleton /> : null}
      {status === "ready" && alumni ? <ProfileContent alumni={alumni} /> : null}
      {status === "notFound" ? (
        <PageNote title={PROFILE_NOT_FOUND_HEADING} text={PROFILE_NOT_FOUND_TEXT}>
          <Link to={backTo}>{PROFILE_NOT_FOUND_LINK}</Link>
        </PageNote>
      ) : null}
      {status === "error" && id !== null ? (
        <ErrorState
          heading={PROFILE_ERROR_HEADING}
          text={loadFailureText(viewed.failure)}
          onRetry={() => retryProfile(id)}
        />
      ) : null}
    </PageLayout>
  );
}

/** The band's sub line, tags and links for a loaded profile. */
function bandDetails(alumni: Alumni) {
  const tags = [
    presentText(alumni.department),
    classLabel(alumni.graduation_year),
    presentText(alumni.field),
  ].filter((tag): tag is string => tag !== null);

  const email = presentText(alumni.email);
  const linkedIn = presentText(alumni.linkedin_url);
  // Only an http(s) address becomes a link: never javascript:, ftp: or
  // anything else (AC16).
  const showLinkedIn = linkedIn !== null && isWebLink(linkedIn);
  const first = firstName(alumni.name);

  return {
    tag: alumni.mentorship_available ? (
      <Tag variant="mentoring">{OPEN_TO_MENTORING}</Tag>
    ) : undefined,
    sub: jobLine(alumni.job_title, alumni.current_company) ?? undefined,
    tags:
      tags.length > 0 ? (
        <>
          {tags.map((tag, index) => (
            <Tag key={index}>{tag}</Tag>
          ))}
        </>
      ) : undefined,
    actions:
      email !== null || showLinkedIn ? (
        <>
          {email !== null ? (
            <ProfileBandAction variant="primary" href={`mailto:${email}`}>
              {first !== null ? profileEmailLink(first) : PROFILE_EMAIL_LABEL}
            </ProfileBandAction>
          ) : null}
          {showLinkedIn ? (
            <ProfileBandAction variant="outline" href={linkedIn} newTab>
              {PROFILE_LINKEDIN_LINK}
              <span className="visuallyHidden"> {OPENS_IN_NEW_TAB}</span>
            </ProfileBandAction>
          ) : null}
        </>
      ) : undefined,
  };
}

/** About and Details: two columns on a wide screen, one on a phone. */
function ProfileContent({ alumni }: { alumni: Alumni }) {
  const aboutId = useId();
  const detailsId = useId();
  const bio = presentText(alumni.bio);
  const email = presentText(alumni.email);
  const year = alumni.graduation_year === null ? null : String(alumni.graduation_year);

  const rows: { label: string; value: string }[] = [
    { label: PROFILE_DEPARTMENT_LABEL, value: orNotGiven(alumni.department) },
    { label: PROFILE_YEAR_LABEL, value: orNotGiven(year) },
    { label: PROFILE_FIELD_LABEL, value: orNotGiven(alumni.field) },
    { label: PROFILE_COMPANY_LABEL, value: orNotGiven(alumni.current_company) },
    { label: PROFILE_JOB_TITLE_LABEL, value: orNotGiven(alumni.job_title) },
    { label: PROFILE_EXPERIENCE_LABEL, value: orNotGiven(alumni.experience) },
  ];

  return (
    <div className={styles.columns}>
      <Card as="section" aria-labelledby={aboutId}>
        <div className={styles.cardBody}>
          <h2 id={aboutId} className={styles.cardHeading}>
            {PROFILE_ABOUT_HEADING}
          </h2>
          <p className={bio !== null ? styles.bio : `${styles.bio} ${styles.muted}`}>
            {bio ?? NOT_GIVEN}
          </p>
        </div>
      </Card>
      <Card as="section" aria-labelledby={detailsId}>
        <div className={styles.cardBody}>
          <h2 id={detailsId} className={styles.cardHeading}>
            {PROFILE_DETAILS_HEADING}
          </h2>
          <dl className={styles.details}>
            {rows.map((row) => (
              <div key={row.label} className={styles.row}>
                <dt className={styles.label}>{row.label}</dt>
                <dd className={styles.value}>{row.value}</dd>
              </div>
            ))}
            <div className={styles.row}>
              <dt className={styles.label}>{PROFILE_EMAIL_LABEL}</dt>
              <dd className={styles.value}>
                {email !== null ? <Link href={`mailto:${email}`}>{email}</Link> : NOT_GIVEN}
              </dd>
            </div>
            <div className={styles.row}>
              <dt className={styles.label}>{PROFILE_MENTORING_LABEL}</dt>
              <dd className={styles.value}>
                {alumni.mentorship_available ? PROFILE_MENTORING_YES : PROFILE_MENTORING_NO}
              </dd>
            </div>
          </dl>
        </div>
      </Card>
    </div>
  );
}

/** The loading state: the same two cards, as still blocks; "Loading" is said once. */
function ProfileSkeleton() {
  return (
    <SkeletonGroup>
      <div className={styles.columns}>
        <Card>
          <div className={styles.cardBody}>
            <Skeleton shape="title" />
            <Skeleton shape="line" />
            <Skeleton shape="line" />
            <Skeleton shape="line" />
          </div>
        </Card>
        <Card>
          <div className={styles.cardBody}>
            <Skeleton shape="title" />
            {Array.from({ length: DETAILS_ROW_COUNT }, (_, index) => (
              <Skeleton key={index} shape="line" />
            ))}
          </div>
        </Card>
      </div>
    </SkeletonGroup>
  );
}
