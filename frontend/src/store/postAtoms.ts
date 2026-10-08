import { atom } from "jotai";
import type { Alumni, Comment, Post, Stats } from "@alumni/shared";
import { mergePosts, nextFeedPage } from "../lib/feedPaging";
import { listAlumni } from "../services/alumniService";
import type { AlumniListParams } from "../services/alumniService";
import { isCancelled, toApiFailure } from "../services/apiError";
import type { ApiFailure } from "../services/apiError";
import { getCommentsByPost } from "../services/commentService";
import { listPosts } from "../services/postService";
import type { PostListParams } from "../services/postService";
import { getStats } from "../services/statsService";
import { createLatestRequest } from "./latestRequest";

// The data of the feed, the dashboard and the profile's "Recent posts": the
// feed list, the one open comment thread, three small lists and the counts.
// Every loader is a write-only atom that never throws, with its own
// `latestRequest` (pattern 23): an older call never overwrites a newer one,
// and a cancelled call changes nothing and shows no error. The writes are in
// postActions.ts.

// Pages read failures from here, never from services/ (pattern 1).
export type { ApiFailure } from "../services/apiError";

export type LoadStatus = "idle" | "loading" | "ready" | "error";

/**
 * The feed. Items are empty unless ready. `more` is the state of "Load more",
 * with its own failure; a failed "Load more" keeps the posts held.
 * `removedIds` are the posts this browser deleted during the visit: a load
 * that was already running when the delete finished drops them (ADV-003).
 */
export interface FeedState {
  status: LoadStatus;
  items: Post[];
  total: number;
  limit: number;
  failure: ApiFailure | null;
  more: "idle" | "loading" | "error";
  moreFailure: ApiFailure | null;
  removedIds: number[];
}

/** The one open comment thread (C3). `postId !== post.id` means "not this post's". */
export interface CommentsState {
  postId: number | null;
  status: LoadStatus;
  items: Comment[];
  failure: ApiFailure | null;
}

/** The newest posts of one author (`authorId`) or of everyone (`null`). */
export interface RecentPostsState {
  status: LoadStatus;
  authorId: number | null;
  items: Post[];
  failure: ApiFailure | null;
}

export type PeopleKind = "newest" | "mentoring";

/** "New in the directory" or "Open to mentoring": the first few of the directory. */
export interface PeopleState {
  status: LoadStatus;
  kind: PeopleKind | null;
  items: Alumni[];
  failure: ApiFailure | null;
}

export interface StatsState {
  status: LoadStatus;
  stats: Stats | null;
  failure: ApiFailure | null;
}

export interface LoadRecentPostsInput {
  // null: everyone's newest posts (the dashboard).
  authorId: number | null;
}

// The small lists show this many (the design draws three).
const SMALL_LIST_LIMIT = 3;
const FIRST_PAGE = 1;

const IDLE_FEED: FeedState = {
  status: "idle",
  items: [],
  total: 0,
  limit: 0,
  failure: null,
  more: "idle",
  moreFailure: null,
  removedIds: [],
};
const IDLE_COMMENTS: CommentsState = {
  postId: null,
  status: "idle",
  items: [],
  failure: null,
};
const IDLE_RECENT_POSTS: RecentPostsState = {
  status: "idle",
  authorId: null,
  items: [],
  failure: null,
};
const IDLE_PEOPLE: PeopleState = { status: "idle", kind: null, items: [], failure: null };
const IDLE_STATS: StatsState = { status: "idle", stats: null, failure: null };

export const feedAtom = atom<FeedState>(IDLE_FEED);
export const commentsAtom = atom<CommentsState>(IDLE_COMMENTS);
export const recentPostsAtom = atom<RecentPostsState>(IDLE_RECENT_POSTS);
export const peopleAtom = atom<PeopleState>(IDLE_PEOPLE);
export const statsAtom = atom<StatsState>(IDLE_STATS);

// One per loader. The feed's is shared by page 1 and "Load more", so a retry
// or a leave cancels a "Load more" and the other way round.
const feedRequest = createLatestRequest();
const commentsRequest = createLatestRequest();
const recentPostsRequest = createLatestRequest();
const peopleRequest = createLatestRequest();
const statsRequest = createLatestRequest();

// Goes up whenever the feed is cleared or reset. A write remembers it when it
// starts and patches nothing if it changed: a save that ends after the page
// closed must not put anything back (LESSON-REQ-fs-005-2).
let postsVisit = 0;

/** The current visit of the feed; see postActions.ts. */
export function currentPostsVisit(): number {
  return postsVisit;
}

/** The answer's posts without the ones deleted during the visit, and how many went. */
function withoutRemoved(
  posts: readonly Post[],
  removedIds: readonly number[],
): { kept: Post[]; dropped: number } {
  const kept = posts.filter((post) => !removedIds.includes(post.id));
  return { kept, dropped: posts.length - kept.length };
}

/** Loads page 1 of the feed. Shows no posts while it loads. */
export const loadFeedAtom = atom(null, async (get, set): Promise<void> => {
  const ticket = feedRequest.begin();
  set(feedAtom, {
    ...IDLE_FEED,
    status: "loading",
    removedIds: get(feedAtom).removedIds,
  });
  const params: PostListParams = { page: FIRST_PAGE };
  try {
    const result = await listPosts(params, ticket.signal);
    if (!ticket.isCurrent()) {
      return;
    }
    const current = get(feedAtom);
    const { kept, dropped } = withoutRemoved(result.items, current.removedIds);
    set(feedAtom, {
      ...current,
      status: "ready",
      items: mergePosts([], kept),
      total: Math.max(0, result.total - dropped),
      limit: result.limit,
      failure: null,
      more: "idle",
      moreFailure: null,
    });
  } catch (error) {
    if (ticket.isCurrent() && !isCancelled(error)) {
      set(feedAtom, {
        ...IDLE_FEED,
        status: "error",
        failure: toApiFailure(error),
        removedIds: get(feedAtom).removedIds,
      });
    }
  }
});

/**
 * Loads the next page of a ready feed and merges it by id. The page is worked
 * out from how many posts are held (`nextFeedPage`), so this browser's own
 * creates and deletes never skip or repeat a post. `total` comes from the
 * answer. On failure the posts held stay and `more` is "error".
 */
export const loadMoreFeedAtom = atom(null, async (get, set): Promise<void> => {
  const before = get(feedAtom);
  if (before.status !== "ready") {
    return;
  }
  const ticket = feedRequest.begin();
  set(feedAtom, { ...before, more: "loading", moreFailure: null });
  const params: PostListParams = {
    page: nextFeedPage(before.items.length, before.limit),
  };
  try {
    const result = await listPosts(params, ticket.signal);
    if (!ticket.isCurrent()) {
      return;
    }
    // Read again: a write may have changed the list while this call ran.
    const current = get(feedAtom);
    const { kept, dropped } = withoutRemoved(result.items, current.removedIds);
    set(feedAtom, {
      ...current,
      items: mergePosts(current.items, kept),
      total: Math.max(0, result.total - dropped),
      limit: result.limit,
      more: "idle",
      moreFailure: null,
    });
  } catch (error) {
    if (ticket.isCurrent() && !isCancelled(error)) {
      set(feedAtom, {
        ...get(feedAtom),
        more: "error",
        moreFailure: toApiFailure(error),
      });
    }
  }
});

/**
 * Opens one post's comments and loads them; any other thread closes. A 404
 * means the post is gone: the state is "error" with that failure, and the
 * page removes the post with `removePostLocallyAtom` (ADV-005).
 */
export const openCommentsAtom = atom(
  null,
  async (_get, set, postId: number): Promise<void> => {
    const ticket = commentsRequest.begin();
    set(commentsAtom, { ...IDLE_COMMENTS, status: "loading", postId });
    try {
      const items = await getCommentsByPost(postId, ticket.signal);
      if (ticket.isCurrent()) {
        set(commentsAtom, { postId, status: "ready", items, failure: null });
      }
    } catch (error) {
      if (ticket.isCurrent() && !isCancelled(error)) {
        set(commentsAtom, {
          ...IDLE_COMMENTS,
          status: "error",
          postId,
          failure: toApiFailure(error),
        });
      }
    }
  },
);

/** Closes the open thread and cancels its call. */
export const closeCommentsAtom = atom(null, (_get, set) => {
  commentsRequest.cancel();
  set(commentsAtom, IDLE_COMMENTS);
});

/**
 * Takes a post off the feed without asking the server: after a delete, a 404
 * on a write, or a 404 on its comments. `total` drops by one only when the
 * post was held. The id is remembered for the visit so a load still running
 * cannot bring it back, and its open thread closes. An idle feed is left alone.
 */
export const removePostLocallyAtom = atom(null, (get, set, id: number) => {
  const feed = get(feedAtom);
  if (feed.status !== "idle") {
    const held = feed.items.some((post) => post.id === id);
    set(feedAtom, {
      ...feed,
      items: held ? feed.items.filter((post) => post.id !== id) : feed.items,
      total: held ? Math.max(0, feed.total - 1) : feed.total,
      removedIds: feed.removedIds.includes(id) ? feed.removedIds : [...feed.removedIds, id],
    });
  }
  if (get(commentsAtom).postId === id) {
    commentsRequest.cancel();
    set(commentsAtom, IDLE_COMMENTS);
  }
});

/**
 * Loads the newest few posts of one author, or of everyone when `authorId`
 * is null. `user_id` is sent only for a number.
 */
export const loadRecentPostsAtom = atom(
  null,
  async (_get, set, input: LoadRecentPostsInput): Promise<void> => {
    const { authorId } = input;
    const ticket = recentPostsRequest.begin();
    set(recentPostsAtom, { ...IDLE_RECENT_POSTS, status: "loading", authorId });
    const params: PostListParams = { page: FIRST_PAGE, limit: SMALL_LIST_LIMIT };
    if (typeof authorId === "number") {
      params.user_id = authorId;
    }
    try {
      const result = await listPosts(params, ticket.signal);
      if (ticket.isCurrent()) {
        set(recentPostsAtom, {
          status: "ready",
          authorId,
          items: result.items,
          failure: null,
        });
      }
    } catch (error) {
      if (ticket.isCurrent() && !isCancelled(error)) {
        set(recentPostsAtom, {
          ...IDLE_RECENT_POSTS,
          status: "error",
          authorId,
          failure: toApiFailure(error),
        });
      }
    }
  },
);

/** Loads the first few people of the directory, or of those open to mentoring. */
export const loadPeopleAtom = atom(
  null,
  async (_get, set, kind: PeopleKind): Promise<void> => {
    const ticket = peopleRequest.begin();
    set(peopleAtom, { ...IDLE_PEOPLE, status: "loading", kind });
    const params: AlumniListParams = { page: FIRST_PAGE, limit: SMALL_LIST_LIMIT };
    if (kind === "mentoring") {
      params.mentoring = "true";
    }
    try {
      const result = await listAlumni(params, ticket.signal);
      if (ticket.isCurrent()) {
        set(peopleAtom, { status: "ready", kind, items: result.items, failure: null });
      }
    } catch (error) {
      if (ticket.isCurrent() && !isCancelled(error)) {
        set(peopleAtom, {
          ...IDLE_PEOPLE,
          status: "error",
          kind,
          failure: toApiFailure(error),
        });
      }
    }
  },
);

/** Loads the counts of the dashboard. */
export const loadStatsAtom = atom(null, async (_get, set): Promise<void> => {
  const ticket = statsRequest.begin();
  set(statsAtom, { status: "loading", stats: null, failure: null });
  try {
    const stats = await getStats(ticket.signal);
    if (ticket.isCurrent()) {
      set(statsAtom, { status: "ready", stats, failure: null });
    }
  } catch (error) {
    if (ticket.isCurrent() && !isCancelled(error)) {
      set(statsAtom, { status: "error", stats: null, failure: toApiFailure(error) });
    }
  }
});

/**
 * Forgets the feed and its open thread and cancels both calls. The feed page
 * calls it when it closes, so the next visit never starts from this one
 * (LESSON-REQ-fs-005-2). A write still running patches nothing afterwards.
 */
export const clearFeedAtom = atom(null, (_get, set) => {
  postsVisit += 1;
  feedRequest.cancel();
  commentsRequest.cancel();
  set(feedAtom, IDLE_FEED);
  set(commentsAtom, IDLE_COMMENTS);
});

/** Forgets the recent posts and cancels their call (dashboard, profile). */
export const clearRecentPostsAtom = atom(null, (_get, set) => {
  recentPostsRequest.cancel();
  set(recentPostsAtom, IDLE_RECENT_POSTS);
});

/** Forgets the small people list and cancels its call. */
export const clearPeopleAtom = atom(null, (_get, set) => {
  peopleRequest.cancel();
  set(peopleAtom, IDLE_PEOPLE);
});

/** Forgets the counts and cancels their call. */
export const clearStatsAtom = atom(null, (_get, set) => {
  statsRequest.cancel();
  set(statsAtom, IDLE_STATS);
});

/**
 * Puts every atom of this file back to idle and cancels every call. The
 * session actions call it beside `resetAlumniAtom` whenever the user
 * changes, so one user's posts are never shown to the next.
 */
export const resetPostsAtom = atom(null, (_get, set) => {
  postsVisit += 1;
  feedRequest.cancel();
  commentsRequest.cancel();
  recentPostsRequest.cancel();
  peopleRequest.cancel();
  statsRequest.cancel();
  set(feedAtom, IDLE_FEED);
  set(commentsAtom, IDLE_COMMENTS);
  set(recentPostsAtom, IDLE_RECENT_POSTS);
  set(peopleAtom, IDLE_PEOPLE);
  set(statsAtom, IDLE_STATS);
});
