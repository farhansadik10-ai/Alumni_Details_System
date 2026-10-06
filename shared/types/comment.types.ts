// A comment as the API answers it: the comment columns plus the author's name
// and photo from the joined "User" row (null when the comment has no user).
// parent_id is null for a top-level comment.
export interface Comment {
  id: number;
  user_id: number | null;
  posts_id: number | null;
  parent_id: number | null;
  content: string | null;
  created_at: Date | null;
  updated_at: Date | null;
  name: string | null;
  photo_url: string | null;
}

export interface CreateCommentDTO {
  user_id: number;
  posts_id: number;
  parent_id?: number;
  content: string;
}

export interface UpdateCommentDTO {
  content: string;
}
