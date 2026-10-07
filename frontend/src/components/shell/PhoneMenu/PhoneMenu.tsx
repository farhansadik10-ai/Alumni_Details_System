import { useSetAtom } from "jotai";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { APP_NAME } from "../../../config/app";
import { CloseIcon } from "../../../icons/CloseIcon";
import { PATHS } from "../../../routes/paths";
import type { Profile } from "../../../store/profileAtoms";
import { logOutAtom } from "../../../store/sessionActions";
import { Avatar } from "../../ui/Avatar/Avatar";
import { Button } from "../../ui/Button/Button";
import { Skeleton, SkeletonGroup, SkeletonStack } from "../../ui/Skeleton/Skeleton";
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

// The phone layout, written as in every stylesheet (architecture.md,
// "Tokens and styles"). The menu closes when the window stops matching it.
const PHONE_LAYOUT_QUERY = "(max-width: 767.98px)";

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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const { pathname } = useLocation();
  const logOut = useSetAtom(logOutAtom);
  const [loggingOut, setLoggingOut] = useState(false);

  // The listeners below are added once, so they read the newest props here.
  const latest = useRef({ open, onClose });
  useEffect(() => {
    latest.current = { open, onClose };
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) {
      return;
    }
    // showModal() throws on a dialog that is already open.
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) {
      return;
    }

    // Escape. The caller owns `open`, so the browser's own close is held back.
    function handleCancel(event: Event) {
      event.preventDefault();
      latest.current.onClose();
    }

    // The browser closed it anyway (a second Escape in a row is not held
    // back). Not our own close(): by then `open` is already false.
    function handleClose() {
      if (latest.current.open) {
        latest.current.onClose();
      }
    }

    dialog.addEventListener("cancel", handleCancel);
    dialog.addEventListener("close", handleClose);
    return () => {
      dialog.removeEventListener("cancel", handleCancel);
      dialog.removeEventListener("close", handleClose);
    };
  }, []);

  // Removed from the page while open (after Log out): close first, while the
  // element is still in the page. A layout effect, because a plain effect
  // cleans up after the element is gone.
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    return () => {
      if (dialog !== null && dialog.open) {
        dialog.close();
      }
    };
  }, []);

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

      <nav className={styles.links} aria-label="Main">
        {[...links, { to: PATHS.myProfile, label: "My profile" }].map(({ to, label }) => (
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
