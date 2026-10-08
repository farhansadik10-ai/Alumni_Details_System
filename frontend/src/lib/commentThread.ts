// The comments of one post, shaped into threads and patched after a write
// (spec C3, AC10 to AC14). Nothing here changes the list it is given.

import type { Comment } from "@alumni/shared";
import { createdTime } from "./postDisplay";

/** A top-level comment and every comment below it, flat. */
export interface CommentThread {
  comment: Comment;
  replies: Comment[];
}

/** Oldest first by created_at, then by id. A missing date goes last. */
function oldestFirst(a: Comment, b: Comment): number {
  const timeA = createdTime(a.created_at);
  const timeB = createdTime(b.created_at);
  if (timeA !== timeB) {
    if (timeA === null) {
      return 1;
    }
    if (timeB === null) {
      return -1;
    }
    return timeA - timeB;
  }
  return a.id - b.id;
}

/**
 * The id of the top-level comment a comment sits under. A comment whose
 * parent is not in the list is top-level itself (it cannot be hidden), and so
 * is a comment caught in a parent loop.
 */
function topLevelId(comment: Comment, byId: Map<number, Comment>): number {
  const seen = new Set<number>([comment.id]);
  let current = comment;
  while (current.parent_id !== null) {
    const parent = byId.get(current.parent_id);
    if (parent === undefined) {
      return current.id;
    }
    if (seen.has(parent.id)) {
      return comment.id;
    }
    seen.add(parent.id);
    current = parent;
  }
  return current.id;
}

/**
 * Top-level comments oldest first, each with every comment below it (a reply
 * to a reply included), flat and oldest first.
 */
export function buildThreads(comments: readonly Comment[]): CommentThread[] {
  const byId = new Map(comments.map((comment) => [comment.id, comment]));
  const threads = new Map<number, CommentThread>();
  const sorted = [...comments].sort(oldestFirst);

  for (const comment of sorted) {
    if (topLevelId(comment, byId) === comment.id) {
      threads.set(comment.id, { comment, replies: [] });
    }
  }
  for (const comment of sorted) {
    const rootId = topLevelId(comment, byId);
    if (rootId !== comment.id) {
      threads.get(rootId)?.replies.push(comment);
    }
  }
  return [...threads.values()];
}

/** The list with the new comment at the end. A comment already held is replaced instead. */
export function appendComment(items: readonly Comment[], comment: Comment): Comment[] {
  if (items.some((item) => item.id === comment.id)) {
    return replaceComment(items, comment);
  }
  return [...items, comment];
}

/** The list with the comment of the same id replaced. An id not held changes nothing. */
export function replaceComment(items: readonly Comment[], comment: Comment): Comment[] {
  return items.map((item) => (item.id === comment.id ? comment : item));
}

/** The ids of every comment below the given one, at any depth (not the comment itself). */
function descendantIds(items: readonly Comment[], id: number): Set<number> {
  const found = new Set<number>();
  let frontier = new Set<number>([id]);
  while (frontier.size > 0) {
    const next = new Set<number>();
    for (const item of items) {
      if (
        item.parent_id !== null &&
        frontier.has(item.parent_id) &&
        item.id !== id &&
        !found.has(item.id)
      ) {
        found.add(item.id);
        next.add(item.id);
      }
    }
    frontier = next;
  }
  return found;
}

/**
 * The list without the comment and every comment below it. An id that no
 * comment has and no comment points to changes nothing; comments that point
 * to an id not held still go (the server removed them with it).
 */
export function removeWithReplies(items: readonly Comment[], id: number): Comment[] {
  const gone = descendantIds(items, id);
  return items.filter((item) => item.id !== id && !gone.has(item.id));
}

/** How many comments sit below the given one, at any depth (for the delete dialog). */
export function countReplies(items: readonly Comment[], id: number): number {
  return descendantIds(items, id).size;
}
