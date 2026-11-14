import { atom } from "jotai";
import type { Getter } from "jotai";
import type { Comment, Post } from "@alumni/shared";
import { presentText } from "../lib/alumniDisplay";
import {
  appendComment,
  countReplies,
  removeWithReplies,
  replaceComment,
} from "../lib/commentThread";
import { isGone } from "../lib/writeFailure";
import { toApiFailure } from "../services/apiError";
import type { ApiFailure } from "../services/apiError";
import {
  createComment,
  deleteComment,
  updateComment,
} from "../services/commentService";
import { createPost, deletePost, updatePost } from "../services/postService";
import {
  commentsAtom,
  currentPostsVisit,
  feedAtom,
  removePostLocallyAtom,
  withCommentCount,
} from "./postAtoms";
import type { FeedState } from "./postAtoms";
import { sessionAtom } from "./sessionAtoms";

// The six writes of the feed: publish, save and delete a post; add, save and
// delete a comment. Each returns a result and never throws; none shows a
// toast or moves focus (pattern 7). After the server answers, the lists are
// patched, not reloaded (C2), and only when it is still safe: the same user,
// the same visit of the feed (no clear or reset since), and the list `ready`.
// A late answer patches nothing and still returns its result.
//
// A 404 on a save or a delete still returns the failure, and also removes the
// item here, so the page can say "already gone" (AC18).
//
// The page maps two failures to its own words: a 400 on `addCommentAtom` with
// a `parent_id` means the comment replied to is gone (ADV-005), and a 404 on
// the comments load means the post is gone (see `removePostLocallyAtom`).
// A comment with no visible text gets `{ ok: false, blank: true }` instead.

export type PostWriteResult = { ok: true } | { ok: false; failure: ApiFailure };

/**
 * A comment add or save. `blank` means the text had nothing visible and
 * nothing was sent: no server answer, so no status the page could misread
 * (a 400 on a reply means "the comment replied to is gone").
 */
export type CommentWriteResult = PostWriteResult | { ok: false; blank: true };

export interface PublishPostInput {
  caption: string;
  media_url: string | null;
}

export interface SavePostInput {
  id: number;
  caption: string;
  media_url: string | null;
}

export interface AddCommentInput {
  posts_id: number;
  content: string;
  parent_id: number | null;
}

export interface SaveCommentInput {
  id: number;
  content: string;
}

// Nothing to write as: no session. The forms are not shown then, so no
// status is worth reporting: "network".
const NOT_READY: ApiFailure = { kind: "network" };

// A comment with no visible text is never sent. The forms check first
// (`validateComment` uses the same `presentText`), so this is a guard with
// its own result, not a made-up server status.
const BLANK_TEXT: CommentWriteResult = { ok: false, blank: true };

/**
 * Remembers who writes and in which visit of the feed. The answer may patch
 * the lists only while `isCurrent()` is true. Null when nobody is logged in.
 */
function startWrite(get: Getter): { isCurrent: () => boolean } | null {
  const session = get(sessionAtom);
  if (session === null) {
    return null;
  }
  const { userId } = session;
  const visit = currentPostsVisit();
  return {
    isCurrent: () =>
      get(sessionAtom)?.userId === userId && currentPostsVisit() === visit,
  };
}

/** The comment count the feed holds for a post, or null when it is not held. */
function heldCommentCount(feed: FeedState, postId: number): number | null {
  return feed.items.find((post) => post.id === postId)?.comment_count ?? null;
}

// Puts a post the server created on top of a ready feed, once.
const putPostOnTopAtom = atom(null, (get, set, post: Post) => {
  const feed = get(feedAtom);
  if (feed.status !== "ready" || feed.items.some((item) => item.id === post.id)) {
    return;
  }
  set(feedAtom, {
    ...feed,
    items: [post, ...feed.items],
    total: feed.total + 1,
    totalEdits: [...feed.totalEdits, { id: post.id, change: 1 }],
  });
});

// Replaces a post the server saved, when the ready feed holds it.
const replacePostAtom = atom(null, (get, set, post: Post) => {
  const feed = get(feedAtom);
  if (feed.status !== "ready") {
    return;
  }
  set(feedAtom, {
    ...feed,
    items: feed.items.map((item) => (item.id === post.id ? post : item)),
  });
});

interface CommentPatch {
  postId: number;
  // The thread list after the write, from the list before it.
  patchList: (items: readonly Comment[]) => Comment[];
  // How much the count changes when the thread is not open for that post.
  countChange: number;
}

// One store update for a comment write (G48): the thread list, when it is
// ready for the same post, and that post's count in the ready feed. With the
// list patched the count is its length, so the two cannot disagree (AC12,
// AC14); otherwise the count moves by `countChange` (ADV-003).
const patchCommentsAtom = atom(null, (get, set, patch: CommentPatch) => {
  const comments = get(commentsAtom);
  const feed = get(feedAtom);
  let newCount: number | null = null;

  if (comments.status === "ready" && comments.postId === patch.postId) {
    const items = patch.patchList(comments.items);
    set(commentsAtom, { ...comments, items });
    newCount = items.length;
  } else {
    const held = heldCommentCount(feed, patch.postId);
    newCount = held === null ? null : held + patch.countChange;
  }

  if (feed.status === "ready" && newCount !== null) {
    set(feedAtom, withCommentCount(feed, patch.postId, newCount));
  }
});

/**
 * Where a comment sits and how many go with it, read from the open thread
 * when the write starts: the thread may close or change while it runs.
 */
function locateComment(
  get: Getter,
  id: number,
): { postId: number; removedCount: number } | null {
  const comments = get(commentsAtom);
  if (
    comments.status !== "ready" ||
    comments.postId === null ||
    !comments.items.some((item) => item.id === id)
  ) {
    return null;
  }
  return {
    postId: comments.postId,
    removedCount: 1 + countReplies(comments.items, id),
  };
}

/** Publishes a post. The caption and image link are trimmed; an empty link is sent as null. */
export const publishPostAtom = atom(
  null,
  async (get, set, input: PublishPostInput): Promise<PostWriteResult> => {
    const scope = startWrite(get);
    if (scope === null) {
      return { ok: false, failure: NOT_READY };
    }
    let post: Post;
    try {
      post = await createPost({
        caption: presentText(input.caption),
        media_url: presentText(input.media_url),
      });
    } catch (error) {
      return { ok: false, failure: toApiFailure(error) };
    }
    if (scope.isCurrent()) {
      set(putPostOnTopAtom, post);
    }
    return { ok: true };
  },
);

/** Saves an edited post (author only). Same trimming as publish. */
export const savePostAtom = atom(
  null,
  async (get, set, input: SavePostInput): Promise<PostWriteResult> => {
    const scope = startWrite(get);
    if (scope === null) {
      return { ok: false, failure: NOT_READY };
    }
    let post: Post;
    try {
      post = await updatePost(input.id, {
        caption: presentText(input.caption),
        media_url: presentText(input.media_url),
      });
    } catch (error) {
      const failure = toApiFailure(error);
      if (isGone(failure) && scope.isCurrent()) {
        set(removePostLocallyAtom, input.id);
      }
      return { ok: false, failure };
    }
    if (scope.isCurrent()) {
      set(replacePostAtom, post);
    }
    return { ok: true };
  },
);

/** Deletes a post (author or admin); its comments go with it and its open thread closes. */
export const deletePostAtom = atom(
  null,
  async (get, set, id: number): Promise<PostWriteResult> => {
    const scope = startWrite(get);
    if (scope === null) {
      return { ok: false, failure: NOT_READY };
    }
    try {
      await deletePost(id);
    } catch (error) {
      const failure = toApiFailure(error);
      if (isGone(failure) && scope.isCurrent()) {
        set(removePostLocallyAtom, id);
      }
      return { ok: false, failure };
    }
    if (scope.isCurrent()) {
      set(removePostLocallyAtom, id);
    }
    return { ok: true };
  },
);

/**
 * Adds a comment, or a reply when `parent_id` is a number. The content is
 * trimmed with `presentText`; empty content is refused without a call. The
 * post's count goes up by one even when its thread is closed.
 */
export const addCommentAtom = atom(
  null,
  async (get, set, input: AddCommentInput): Promise<CommentWriteResult> => {
    const scope = startWrite(get);
    if (scope === null) {
      return { ok: false, failure: NOT_READY };
    }
    const content = presentText(input.content);
    if (content === null) {
      return BLANK_TEXT;
    }
    const postId = input.posts_id;
    let comment: Comment;
    try {
      comment = await createComment({
        posts_id: postId,
        content,
        parent_id: input.parent_id,
      });
    } catch (error) {
      return { ok: false, failure: toApiFailure(error) };
    }
    if (scope.isCurrent()) {
      set(patchCommentsAtom, {
        postId,
        patchList: (items) => appendComment(items, comment),
        countChange: 1,
      });
    }
    return { ok: true };
  },
);

/**
 * Saves an edited comment (author only). Same trimming as add. A 404 removes
 * it and its replies here.
 */
export const saveCommentAtom = atom(
  null,
  async (get, set, input: SaveCommentInput): Promise<CommentWriteResult> => {
    const scope = startWrite(get);
    if (scope === null) {
      return { ok: false, failure: NOT_READY };
    }
    const content = presentText(input.content);
    if (content === null) {
      return BLANK_TEXT;
    }
    const where = locateComment(get, input.id);
    let comment: Comment;
    try {
      comment = await updateComment(input.id, { content });
    } catch (error) {
      const failure = toApiFailure(error);
      if (isGone(failure) && where !== null && scope.isCurrent()) {
        set(patchCommentsAtom, {
          postId: where.postId,
          patchList: (items) => removeWithReplies(items, input.id),
          countChange: -where.removedCount,
        });
      }
      return { ok: false, failure };
    }
    if (scope.isCurrent() && where !== null) {
      set(patchCommentsAtom, {
        postId: where.postId,
        patchList: (items) => replaceComment(items, comment),
        countChange: 0,
      });
    }
    return { ok: true };
  },
);

/**
 * Deletes a comment (author or admin) with every reply under it. The post's
 * count drops by the comment and its replies, even when the thread closed
 * meanwhile. A 404 removes it here too.
 */
export const deleteCommentAtom = atom(
  null,
  async (get, set, id: number): Promise<PostWriteResult> => {
    const scope = startWrite(get);
    if (scope === null) {
      return { ok: false, failure: NOT_READY };
    }
    const where = locateComment(get, id);
    let failure: ApiFailure | null = null;
    try {
      await deleteComment(id);
    } catch (error) {
      failure = toApiFailure(error);
    }
    const gone = failure === null || isGone(failure);
    if (gone && where !== null && scope.isCurrent()) {
      set(patchCommentsAtom, {
        postId: where.postId,
        patchList: (items) => removeWithReplies(items, id),
        countChange: -where.removedCount,
      });
    }
    return failure === null ? { ok: true } : { ok: false, failure };
  },
);
