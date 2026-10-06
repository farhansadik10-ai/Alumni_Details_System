import { BaseDTO } from "./BaseDTO";

// Mirrors the comment table in db/schema.md. Every column the table shows
// without "not null" is typed `T | null` (gotcha G31).
export class CommentDTO implements BaseDTO {
  id!: number;
  user_id: number | null;
  posts_id: number | null;
  parent_id: number | null;
  content: string | null;
  created_at: Date | null;
  updated_at: Date | null;
  // The author, read from the joined "User" row; never written to comment.
  name?: string | null;
  photo_url?: string | null;

  constructor(
    userId?: number | null,
    postID?: number | null,
    content?: string | null,
    parentID?: number | null,
  ) {
    this.user_id = userId ?? null;
    this.posts_id = postID ?? null;
    this.parent_id = parentID ?? null;
    this.content = content ?? null;
    const now = new Date();
    this.created_at = now;
    this.updated_at = now;
  }
}
