import { useSetAtom } from "jotai";
import { useEffect, useId, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { APP_NAME } from "../../../config/app";
import { PHONE_LAYOUT_QUERY } from "../../../config/layout";
import { useModalDialog } from "../../../hooks/useModalDialog";
import { CloseIcon } from "../../../icons/CloseIcon";
import { PATHS } from "../../../routes/paths";
import type { Profile } from "../../../store/profileAtoms";
import { logOutAtom } from "../../../store/sessionActions";
import { Avatar } from "../../ui/Avatar/Avatar";
import { Button } from "../../ui/Button/Button";
import { Skeleton, SkeletonGroup, SkeletonStack } from "../../ui/Skeleton/Skeleton";
import { MAIN_NAV_LABEL, MY_PROFILE_LABEL } from "../navLabels";
import { ThemeSwitch } from "../ThemeSwitch/ThemeSwitch";
import styles from "./PhoneMenu.module.css";

export type PhoneMenuLink = {
  to: string;
  label: string;
};

export type PhoneMenuProps = {
  open: boolean;
  // Asked for by Escape, the close button, a chosen link, a route change and
  // a window that grew past the phone layout. The caller answers by setting
  // `open` to false; the menu does not close on its own.
  onClose: () => void;
  /** The main links, in order. The menu adds My profile after them. */
  links: readonly PhoneMenuLink[];
  profile: Profile;
};

/** Who is logged in: avatar, name, email. Nothing when the profile call failed. */
function Person({ profile }: { profile: Profile }) {
  if (profile.status === "idle" || profile.status === "loading") {
    return (
      <SkeletonGroup layout="row">
        <Skeleton shape="avatar-md" />
        <SkeletonStack>
          <Skeleton shape="title" />
          <Skeleton shape="line" />
        </SkeletonStack>
      </SkeletonGroup>
    );
  }

  const { user } = profile;
  if (user === null) {
    return null;
  }

  const name = user.name?.trim() || null;

  return (
    <div className={styles.person}>
      <Avatar size="md" name={name} photoUrl={user.photo_url} />
      <div className={styles.personText}>
        {name !== null ? <div className={styles.name}>{name}</div> : null}
        <div className={styles.email}>{user.email}</div>
      </div>
    </div>
  );
}

/**
 * The full-screen menu of the phone layout (AC33, phone-menu.html). A native
 * <dialog> opened with showModal(): the browser moves focus inside, keeps Tab
 * inside, closes on Escape and gives focus back to the menu button.
 * It has its own look; it does not share the card of ui/Dialog.
 */
export function PhoneMenu({ open, onClose, links, profile }: PhoneMenuProps) {
  const dialogRef = useModalDialog({ open, onClose });
  const titleId = useId();
  const { pathname } = useLocation();
  const logOut = useSetAtom(logOutAtom);
  const [loggingOut, setLoggingOut] = useState(false);

  // The effects below read the newest props here (the route-change effect must
  // not run again when they change).
  const latest = useRef({ open, onClose });
  useEffect(() => {
    latest.current = { open, onClose };
  });

  // The page changed (a link here, or the browser's Back button).
  useEffect(() => {
    if (latest.current.open) {
      latest.current.onClose();
    }
  }, [pathname]);

  // The window grew past the phone layout: the header shows the links again.
  useEffect(() => {
    if (!open) {
      return;
    }
    // The menu closes when the window stops matching the phone layout.
    const phoneLayout = window.matchMedia(PHONE_LAYOUT_QUERY);
    function handleChange() {
      if (!phoneLayout.matches) {
        latest.current.onClose();
      }
    }
    phoneLayout.addEventListener("change", handleChange);
    return () => phoneLayout.removeEventListener("change", handleChange);
  }, [open]);

  // The route guard sends the user to log in when the session is gone, and
  // this menu leaves the page with the shell. Nothing navigates here.
  function handleLogOut() {
    setLoggingOut(true);
    void logOut();
  }

  return (
    <dialog ref={dialogRef} className={styles.menu} aria-labelledby={titleId}>
      <h2 id={titleId} className="visuallyHidden">
        Menu
      </h2>

      <div className={styles.top}>
        <div className={styles.appName}>{APP_NAME}</div>
        <button
          type="button"
          className={styles.closeButton}
          aria-label="Close menu"
          onClick={onClose}
        >
          <CloseIcon size="lg" />
        </button>
      </div>

      <nav className={styles.links} aria-label={MAIN_NAV_LABEL}>
        {[...links, { to: PATHS.myProfile, label: MY_PROFILE_LABEL }].map(({ to, label }) => (
          // Also closes when the link leads to the page that is already open.
          <NavLink key={to} className={styles.link} to={to} onClick={onClose}>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className={styles.theme}>
        {/* The switch names itself "Theme" for a screen reader. */}
        <div className={styles.themeLabel} aria-hidden="true">
          Theme
        </div>
        <ThemeSwitch variant="text" />
      </div>

      <div className={styles.account}>
        <Person profile={profile} />
        <Button size="lg" fullWidth busy={loggingOut} onClick={handleLogOut}>
          Log out
        </Button>
      </div>
    </dialog>
  );
}
