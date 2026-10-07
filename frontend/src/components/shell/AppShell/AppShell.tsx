import { useAtomValue, useSetAtom, useStore } from "jotai";
import { Suspense, useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { PATHS } from "../../../routes/paths";
import { loadProfileAtom, profileAtom } from "../../../store/profileAtoms";
import { sessionAtom } from "../../../store/sessionAtoms";
import { Card } from "../../ui/Card/Card";
import { Skeleton, SkeletonGroup } from "../../ui/Skeleton/Skeleton";
import { Footer } from "../Footer/Footer";
import { Header } from "../Header/Header";
import { PageLayout } from "../PageLayout/PageLayout";
import { SkipLink } from "../SkipLink/SkipLink";
import styles from "./AppShell.module.css";

const MAIN_ID = "main-content";

/** Shown in place of a page while its code is fetched. The header stays. */
function PageLoading() {
  return (
    <PageLayout heading="Loading">
      <Card>
        <SkeletonGroup>
          <Skeleton shape="title" />
          <Skeleton shape="line" />
          <Skeleton shape="line" />
        </SkeletonGroup>
      </Card>
    </PageLayout>
  );
}

/**
 * The frame around every page a logged-in user sees: skip link, header, the
 * page, footer. It also loads the user's own profile for the header.
 */
export function AppShell() {
  const userId = useAtomValue(sessionAtom)?.userId ?? null;
  const profileStatus = useAtomValue(profileAtom).status;
  const loadProfile = useSetAtom(loadProfileAtom);
  const store = useStore();
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const shownPath = useRef(pathname);

  // The session actions set the profile back to "idle" whenever the user
  // changes, so "idle" means: this user's profile has not been asked for yet.
  // The status is read from the store at that moment, not from this render:
  // in development React runs an effect twice, and the second run must see
  // that the first one already asked.
  useEffect(() => {
    if (userId !== null && store.get(profileAtom).status === "idle") {
      void loadProfile();
    }
  }, [userId, profileStatus, store, loadProfile]);

  // A new page: move focus to its heading, so a keyboard or screen reader
  // user starts at the top of it. Not on the first load.
  useEffect(() => {
    const previousPath = shownPath.current;
    shownPath.current = pathname;
    // PATHS.home shows nothing and only sends the user on to the Dashboard.
    if (previousPath === pathname || previousPath === PATHS.home) {
      return;
    }
    mainRef.current?.querySelector("h1")?.focus();
  }, [pathname]);

  return (
    <div className={styles.shell}>
      <SkipLink targetId={MAIN_ID} />
      <Header />
      <main ref={mainRef} id={MAIN_ID} className={styles.main} tabIndex={-1}>
        <Suspense fallback={<PageLoading />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
