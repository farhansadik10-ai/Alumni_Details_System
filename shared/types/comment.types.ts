// A comment as the API answers it: the comment columns plus the author's name
// and photo from the joined "User" row (null when the comment has no user).
// parent_id is null for a top-level comment.
// The two dates travel as JSON, so they are ISO date strings, not Dates.
export interface Comment {
  id: number;
  user_id: number | null;
  posts_id: number | null;
  parent_id: number | null;
  content: string | null;
  created_at: string | null;
  updated_at: string | null;
  name: string | null;
  photo_url: string | null;
}

// The body of POST /api/comments. The author comes from the login token,
// never from the body. parent_id left out or null makes a top-level comment;
// a number must be a comment on the same post. content must have at least one
// visible character.
export interface CreateCommentDTO {
  posts_id: number;
  content: string;
  parent_id?: number | null;
}

// The body of PUT /api/comments/:id. Only the content can change.
export interface UpdateCommentDTO {
  content: string;
}
