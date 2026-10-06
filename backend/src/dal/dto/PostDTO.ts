import { BaseDTO } from "./BaseDTO";

// Mirrors the posts table in db/schema.md. Every column the table shows
// without "not null" is typed `T | null` (gotcha G31).
export class PostDTO implements BaseDTO {
  id!: number;
  user_id: number | null;
  caption: string | null;
  media_url: string | null;
  comment_count: number | null;
  created_at: Date | null;
  updated_at: Date | null;
  // The author, read from the joined "User" row; never written to posts.
  name?: string | null;
  photo_url?: string | null;

  constructor(
    userId?: number | null,
    caption?: string | null,
    mediaUrl?: string | null,
  ) {
    this.user_id = userId ?? null;
    this.caption = caption ?? null;
    this.media_url = mediaUrl ?? null;
    this.comment_count = 0;
    const now = new Date();
    this.created_at = now;
    this.updated_at = now;
  }
}
