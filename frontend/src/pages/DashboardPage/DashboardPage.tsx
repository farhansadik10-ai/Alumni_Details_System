import { useCallback, useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { PeopleBlock } from "../../components/alumni/PeopleBlock/PeopleBlock";
import { CountsBlock } from "../../components/dashboard/CountsBlock/CountsBlock";
import type { CountsBlockState } from "../../components/dashboard/CountsBlock/CountsBlock";
import { RecentPostsBlock } from "../../components/dashboard/RecentPostsBlock/RecentPostsBlock";
import type { RecentPostsBlockState } from "../../components/dashboard/RecentPostsBlock/RecentPostsBlock";
import { YourProfileBlock } from "../../components/dashboard/YourProfileBlock/YourProfileBlock";
import { PageLayout } from "../../components/shell/PageLayout/PageLayout";
import { ButtonLink } from "../../components/ui/ButtonLink/ButtonLink";
import {
  DASHBOARD_RECENT_EMPTY_HEADING,
  DASHBOARD_RECENT_EMPTY_LINK,
  DASHBOARD_RECENT_EMPTY_READER_TEXT,
  DASHBOARD_RECENT_EMPTY_WRITER_TEXT,
  DASHBOARD_RECENT_ERROR_HEADING,
  DASHBOARD_RECENT_HEADING,
  DASHBOARD_SUB,
  DASHBOARD_WRITE_POST_LINK,
  PEOPLE_ERROR_HEADING,
  PEOPLE_NEW_EMPTY_HEADING,
  PEOPLE_NEW_EMPTY_TEXT,
  PEOPLE_NEW_HEADING,
  dashboardGreeting,
} from "../../config/text";
import { firstName } from "../../lib/alumniDisplay";
import { canWritePosts } from "../../lib/token";
import { PATHS } from "../../routes/paths";
import { clearMyAlumniAtom, loadMyAlumniAtom, myAlumniAtom } from "../../store/alumniAtoms";
import { toPeopleBlockState } from "../../store/peopleBlockState";
import {
  clearPeopleAtom,
  clearRecentPostsAtom,
  clearStatsAtom,
  loadPeopleAtom,
  loadRecentPostsAtom,
  loadStatsAtom,
  peopleAtom,
  recentPostsAtom,
  statsAtom,
} from "../../store/postAtoms";
import type { RecentPostsState, StatsState } from "../../store/postAtoms";
import { profileAtom } from "../../store/profileAtoms";
import { sessionAtom } from "../../store/sessionAtoms";
import styles from "./DashboardPage.module.css";

// The Dashboard's recent posts are everyone's newest, not one author's.
const EVERYONE: null = null;

// The atoms carry "idle" and a key; the blocks draw only loading, ready and
// error. An idle state, or one loaded for another key, is "loading" here, so
// a block never shows a frame of another page's data (pattern 23). The people
// list uses the shared toPeopleBlockState.

function toCountsState(state: StatsState): CountsBlockState {
  if (state.status === "idle") {
    return { status: "loading", stats: null, failure: null };
  }
  return { status: state.status, stats: state.stats, failure: state.failure };
}

function toRecentPostsState(state: RecentPostsState): RecentPostsBlockState {
  if (state.status === "idle" || state.authorId !== EVERYONE) {
    return { status: "loading", items: [], failure: null };
  }
  return { status: state.status, items: state.items, failure: state.failure };
}

/**
 * The Dashboard (dashboard.html, AC21 to AC25): the counts over the band,
 * then Recent posts beside an aside with Your profile and New in the
 * directory. Four blocks, each with its own load, states and retry: one
 * failing block leaves the other three as they are. A student's page never
 * asks for /api/alumni/me.
 */
export default function DashboardPage() {
  const session = useAtomValue(sessionAtom);
  const profile = useAtomValue(profileAtom);
  const stats = useAtomValue(statsAtom);
  const recentPosts = useAtomValue(recentPostsAtom);
  const people = useAtomValue(peopleAtom);
  const myAlumni = useAtomValue(myAlumniAtom);

  const loadStats = useSetAtom(loadStatsAtom);
  const loadRecentPosts = useSetAtom(loadRecentPostsAtom);
  const loadPeople = useSetAtom(loadPeopleAtom);
  const loadMyAlumni = useSetAtom(loadMyAlumniAtom);
  const clearStats = useSetAtom(clearStatsAtom);
  const clearRecentPosts = useSetAtom(clearRecentPostsAtom);
  const clearPeople = useSetAtom(clearPeopleAtom);
  const clearMyAlumni = useSetAtom(clearMyAlumniAtom);

  const role = session?.role ?? null;
  const userId = session?.userId ?? null;
  // Only alumni and admin have an alumni profile, and only they may post.
  const writer = canWritePosts(role);

  const retryStats = useCallback(() => void loadStats(), [loadStats]);
  const retryRecentPosts = useCallback(
    () => void loadRecentPosts({ authorId: EVERYONE }),
    [loadRecentPosts],
  );
  const retryPeople = useCallback(() => void loadPeople("newest"), [loadPeople]);
  const retryMyAlumni = useCallback(() => void loadMyAlumni(), [loadMyAlumni]);

  // The four loads start together and are forgotten when the page closes, or
  // when the user or role changes while it is open (LESSON-REQ-fs-005-2).
  useEffect(() => {
    if (userId === null) {
      return undefined;
    }
    void loadStats();
    void loadRecentPosts({ authorId: EVERYONE });
    void loadPeople("newest");
    if (writer) {
      void loadMyAlumni();
    }
    return () => {
      clearStats();
      clearRecentPosts();
      clearPeople();
      clearMyAlumni();
    };
  }, [
    userId,
    writer,
    loadStats,
    loadRecentPosts,
    loadPeople,
    loadMyAlumni,
    clearStats,
    clearRecentPosts,
    clearPeople,
    clearMyAlumni,
  ]);

  // "Welcome back" until the name is known; the same <h1> then gets the name.
  const user = profile.status === "ready" ? profile.user : null;
  const heading = dashboardGreeting(firstName(user?.name ?? null));

  return (
    <PageLayout heading={heading} sub={DASHBOARD_SUB}>
      <CountsBlock state={toCountsState(stats)} onRetry={retryStats} />
      <div className={styles.columns}>
        <div className={styles.main}>
          <RecentPostsBlock
            heading={DASHBOARD_RECENT_HEADING}
            state={toRecentPostsState(recentPosts)}
            showAuthor
            emptyHeading={DASHBOARD_RECENT_EMPTY_HEADING}
            emptyText={
              writer ? DASHBOARD_RECENT_EMPTY_WRITER_TEXT : DASHBOARD_RECENT_EMPTY_READER_TEXT
            }
            emptyAction={{ label: DASHBOARD_RECENT_EMPTY_LINK, to: PATHS.feed }}
            errorHeading={DASHBOARD_RECENT_ERROR_HEADING}
            onRetry={retryRecentPosts}
            action={
              writer ? (
                <ButtonLink to={PATHS.feed} variant="primary">
                  {DASHBOARD_WRITE_POST_LINK}
                </ButtonLink>
              ) : undefined
            }
          />
        </div>
        <aside className={styles.side}>
          <YourProfileBlock
            role={role}
            state={myAlumni}
            userName={user?.name ?? null}
            userPhoto={user?.photo_url ?? null}
            onRetry={retryMyAlumni}
          />
          <PeopleBlock
            heading={PEOPLE_NEW_HEADING}
            state={toPeopleBlockState(people, "newest")}
            emptyHeading={PEOPLE_NEW_EMPTY_HEADING}
            emptyText={PEOPLE_NEW_EMPTY_TEXT}
            errorHeading={PEOPLE_ERROR_HEADING}
            onRetry={retryPeople}
            variant="plain"
          />
        </aside>
      </div>
    </PageLayout>
  );
}
