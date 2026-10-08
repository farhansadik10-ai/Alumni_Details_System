import { useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { AccountCard } from "../../components/profile/AccountCard/AccountCard";
import { AlumniProfileCard } from "../../components/profile/AlumniProfileCard/AlumniProfileCard";
import { PageLayout } from "../../components/shell/PageLayout/PageLayout";
import {
  ProfileBand,
  ProfileBandAction,
} from "../../components/shell/ProfileBand/ProfileBand";
import { RoleTag } from "../../components/ui/Tag/RoleTag";
import {
  MY_PROFILE_HEADING,
  MY_PROFILE_PUBLIC_LINK,
  myProfileSub,
} from "../../config/text";
import { alumniProfilePath } from "../../routes/paths";
import { clearMyAlumniAtom, myAlumniAtom } from "../../store/alumniAtoms";
import { profileAtom } from "../../store/profileAtoms";
import { sessionAtom } from "../../store/sessionAtoms";
import styles from "./MyProfilePage.module.css";

/**
 * My profile (AC21 to AC33): the band, then the cards for the user's role.
 * An alumnus or an admin gets the Alumni profile card first and the Account
 * card next to it; anyone else (a student, a role we do not know) gets only
 * the Account card, so their page never asks for /api/alumni/me (AC22).
 * Log out lives in the Account card (AC33).
 */
export default function MyProfilePage() {
  const session = useAtomValue(sessionAtom);
  const profile = useAtomValue(profileAtom);
  const myAlumni = useAtomValue(myAlumniAtom);
  const clearMyAlumni = useSetAtom(clearMyAlumniAtom);

  // Only when the page closes: while it is open the band's public link
  // reads the saved profile from the atom (CORR-004, ARCH-005).
  useEffect(() => () => clearMyAlumni(), [clearMyAlumni]);

  // The role in the token decides the cards and the band's tag, so the two
  // always agree.
  const role = session?.role ?? null;
  const hasAlumniCard = session !== null && (role === "alumni" || role === "admin");

  const user = profile.status === "ready" ? profile.user : null;
  const sub = user ? myProfileSub(user.name, user.email) : "";
  // Only a profile that exists has a public page (AC32).
  const publicProfile =
    hasAlumniCard && myAlumni.status === "ready" ? myAlumni.alumni : null;

  return (
    <PageLayout
      heading={MY_PROFILE_HEADING}
      band={
        <ProfileBand
          avatar={{ name: user?.name ?? null, photoUrl: user?.photo_url ?? null }}
          tag={role !== null ? <RoleTag role={role} /> : undefined}
          heading={MY_PROFILE_HEADING}
          sub={sub !== "" ? sub : undefined}
          loading={profile.status === "idle" || profile.status === "loading"}
          actions={
            publicProfile !== null ? (
              <ProfileBandAction variant="outline" to={alumniProfilePath(publicProfile.id)}>
                {MY_PROFILE_PUBLIC_LINK}
              </ProfileBandAction>
            ) : undefined
          }
        />
      }
    >
      {hasAlumniCard ? (
        <div className={styles.cards}>
          <div className={styles.main}>
            {/* Keyed on the user only: another user gets a fresh card (ADV-001),
                the same user keeps one mounted card (ADV-002). */}
            <AlumniProfileCard key={session.userId} />
          </div>
          <div className={styles.side}>
            {/* "Save profile" is the view's one primary button. */}
            <AccountCard primary={false} />
          </div>
        </div>
      ) : (
        <div className={styles.alone}>
          <AccountCard />
        </div>
      )}
    </PageLayout>
  );
}
