import type {
  Comment,
  CreateCommentDTO,
  UpdateCommentDTO,
} from "@alumni/shared";
import { apiClient } from "./apiClient";
// The comments of one post are read under the post, not under /api/comments.
import { POSTS_PATH } from "./postService";

const COMMENTS_PATH = "/api/comments";

// A cancelled call (its `signal` aborted) rejects; tell it apart from a
// failure with `isCancelled` from apiError.ts.

/** Oldest first, replies included (`parent_id` set). A 404 means no such post. */
export async function getCommentsByPost(
  postId: number,
  signal?: AbortSignal,
): Promise<Comment[]> {
  const response = await apiClient.get<Comment[]>(
    `${POSTS_PATH}/${postId}/comments`,
    { signal },
  );
  return response.data;
}

/** The body key is `posts_id`, not `post_id`. The answer is the joined read. */
export async function createComment(body: CreateCommentDTO): Promise<Comment> {
  const response = await apiClient.post<Comment>(COMMENTS_PATH, body);
  return response.data;
}

/** Author only; only the content changes. */
export async function updateComment(
  id: number,
  body: UpdateCommentDTO,
): Promise<Comment> {
  const response = await apiClient.put<Comment>(`${COMMENTS_PATH}/${id}`, body);
  return response.data;
}

/** Author or admin. Every reply under it goes too (ADR-06). */
export async function deleteComment(id: number): Promise<void> {
  await apiClient.delete(`${COMMENTS_PATH}/${id}`);
}
