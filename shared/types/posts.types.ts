// A post as the API answers it: the post columns, a comment count worked out
// when the post is read, and the author's name and photo from the joined
// "User" row (null when the post has no user).
export interface Post {
  id: number;
  user_id: number | null;
  caption: string | null;
  media_url: string | null;
  comment_count: number;
  created_at: Date | null;
  updated_at: Date | null;
  name: string | null;
  photo_url: string | null;
}

export interface CreatePostDTO {
  user_id: number;
  caption?: string;
  media_url?: string;
}

export interface UpdatePostDTO {
  caption?: string;
  media_url?: string;
}
