// The feed's "Load more" rule (architecture, "The Load more rule"). The API
// pages by number, and this browser's own creates and deletes move posts
// between pages, so the next page is worked out from how many posts are held
// and the answer is merged by id. No post shows twice and none is skipped by
// this browser's own writes.

import type { Post } from "@alumni/shared";
import { createdTime } from "./postDisplay";

/** floor(held / limit) + 1. A limit below 1 gives page 1. */
export function nextFeedPage(held: number, limit: number): number {
  if (!(limit >= 1)) {
    return 1;
  }
  const count = Number.isFinite(held) && held > 0 ? held : 0;
  return Math.floor(count / limit) + 1;
}

/** Newest first by created_at, then by id, highest first. A missing date goes last. */
function newestFirst(a: Post, b: Post): number {
  const timeA = createdTime(a.created_at);
  const timeB = createdTime(b.created_at);
  if (timeA !== timeB) {
    if (timeA === null) {
      return 1;
    }
    if (timeB === null) {
      return -1;
    }
    return timeB - timeA;
  }
  return b.id - a.id;
}

/**
 * One list, newest first, no id twice. For an id in both lists the incoming
 * copy wins (it is the newer answer).
 */
export function mergePosts(held: readonly Post[], incoming: readonly Post[]): Post[] {
  const byId = new Map<number, Post>();
  for (const post of held) {
    byId.set(post.id, post);
  }
  for (const post of incoming) {
    byId.set(post.id, post);
  }
  return [...byId.values()].sort(newestFirst);
}
