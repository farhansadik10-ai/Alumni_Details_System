import { useAtomValue } from "jotai";
import { useCallback, useState } from "react";
import { Link as RouterLink, NavLink } from "react-router-dom";
import { APP_NAME } from "../../../config/app";
import { MenuIcon } from "../../../icons/MenuIcon";
import { presentText } from "../../../lib/alumniDisplay";
import { isAdmin } from "../../../lib/token";
import { PATHS } from "../../../routes/paths";
import { profileAtom } from "../../../store/profileAtoms";
import type { Profile } from "../../../store/profileAtoms";
import { sessionAtom } from "../../../store/sessionAtoms";
import { Avatar } from "../../ui/Avatar/Avatar";
import { Skeleton, SkeletonGroup, SkeletonStack } from "../../ui/Skeleton/Skeleton";
import { MAIN_NAV_LABEL, MY_PROFILE_LABEL } from "../navLabels";
import { PhoneMenu } from "../PhoneMenu/PhoneMenu";
import type { PhoneMenuLink } from "../PhoneMenu/PhoneMenu";
import { ThemeSwitch } from "../ThemeSwitch/ThemeSwitch";
import styles from "./Header.module.css";

const EVERYONE_LINKS: readonly PhoneMenuLink[] = [
  { to: PATHS.dashboard, label: "Dashboard" },
  { to: PATHS.directory, label: "Directory" },
  { to: PATHS.feed, label: "Feed" },
];

// Users is for admins only. The page has its own guard (RequireAdmin).
const ADMIN_LINKS: readonly PhoneMenuLink[] = [
  ...EVERYONE_LINKS,
  { to: PATHS.users, label: "Users" },
];

/** What the link to My profile holds: the avatar and the name (AC41). */
function UserBlock({ profile }: { profile: Profile }) {
  // "idle" is the moment before the shell asks for the profile.
  if (profile.status === "idle" || profile.status === "loading") {
    return (
      <>
        <span className="visuallyHidden">{MY_PROFILE_LABEL}</span>
        <div className={styles.userLoading}>
          <SkeletonGroup layout="row">
            <Skeleton shape="avatar-sm" />
            <SkeletonStack>
              <Skeleton shape="line" />
            </SkeletonStack>
          </SkeletonGroup>
        </div>
      </>
    );
  }

  const name = presentText(profile.user?.name);

  // The call failed, or the user has no name: a plain avatar and plain words.
  if (name === null) {
    return (
      <>
        <Avatar size="sm" name={null} photoUrl={profile.user?.photo_url} />
        {MY_PROFILE_LABEL}
      </>
    );
  }

  return (
    <>
      <Avatar size="sm" name={name} photoUrl={profile.user?.photo_url} />
      <span className={styles.userName}>{name}</span>
      <span className="visuallyHidden">, {MY_PROFILE_LABEL}</span>
    </>
  );
}

/**
 * The header of every shell page (AC32, AC33). Wide screens: app name, main
 * links, theme switch, the user. Below 768px: the app name and a menu button
 * that opens the full-screen menu.
 */
export function Header() {
  const session = useAtomValue(sessionAtom);
  const profile = useAtomValue(profileAtom);
  const [menuOpen, setMenuOpen] = useState(false);

  const links = isAdmin(session) ? ADMIN_LINKS : EVERYONE_LINKS;
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.start}>
          <RouterLink className={styles.appName} to={PATHS.dashboard}>
            {APP_NAME}
          </RouterLink>
          <nav className={styles.nav} aria-label={MAIN_NAV_LABEL}>
            {links.map(({ to, label }) => (
              // NavLink sets aria-current="page" on the current one.
              <NavLink key={to} className={styles.navLink} to={to}>
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className={styles.end}>
          <ThemeSwitch variant="icons" />
          <RouterLink className={styles.user} to={PATHS.myProfile}>
            <UserBlock profile={profile} />
          </RouterLink>
        </div>

        <button
          type="button"
          className={styles.menuButton}
          aria-label="Open menu"
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <MenuIcon size="lg" />
        </button>
      </div>

      <PhoneMenu open={menuOpen} onClose={closeMenu} links={links} profile={profile} />
    </header>
  );
}
