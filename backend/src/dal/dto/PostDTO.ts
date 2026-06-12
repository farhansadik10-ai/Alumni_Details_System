import { BaseDTO } from "./BaseDTO";

export class PostDTO implements BaseDTO {
  id: number;
  user_id: number;
  caption?: string;
  media_url?: string;
  comment_count?: number;
  created_at?: Date;
  updated_at?: Date;

  constructor(userId: number, caption?: string, mediaUrl?: string) {
    this.user_id = userId;
    this.caption = caption;
    this.media_url = mediaUrl;
    this.comment_count = 0;
    const now = new Date();
    this.created_at = now;
    this.updated_at = now;
  }
}
