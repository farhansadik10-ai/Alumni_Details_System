import type { CreatePostDTO, Paged, Post, UpdatePostDTO } from "@alumni/shared";
import { apiClient } from "./apiClient";

// Exported only for commentService: a post's comments are read under it.
export const POSTS_PATH = "/api/posts";

/**
 * The query of GET /api/posts. A key left out is not sent: no `limit` means
 * the server's default page size, no `user_id` means every author.
 */
export interface PostListParams {
  page?: number;
  limit?: number;
  user_id?: number;
}

// A cancelled call (its `signal` aborted) rejects; tell it apart from a
// failure with `isCancelled` from apiError.ts.

/** Newest first. Each post carries its author's name and photo. */
export async function listPosts(
  params: PostListParams,
  signal?: AbortSignal,
): Promise<Paged<Post>> {
  const response = await apiClient.get<Paged<Post>>(POSTS_PATH, {
    params,
    signal,
  });
  return response.data;
}

/** The author is the logged-in user. The answer is the joined read. */
export async function createPost(body: CreatePostDTO): Promise<Post> {
  const response = await apiClient.post<Post>(POSTS_PATH, body);
  return response.data;
}

/** Author only (ADR-02). Only the fields sent are written; null clears one. */
export async function updatePost(
  id: number,
  body: UpdatePostDTO,
): Promise<Post> {
  const response = await apiClient.put<Post>(`${POSTS_PATH}/${id}`, body);
  return response.data;
}

/** Author or admin. Its comments and replies go with it (ADR-06). */
export async function deletePost(id: number): Promise<void> {
  await apiClient.delete(`${POSTS_PATH}/${id}`);
}
