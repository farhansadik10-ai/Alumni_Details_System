// A post as the API answers it: the post columns, a comment count worked out
// when the post is read, and the author's name and photo from the joined
// "User" row (null when the post has no user).
// The two dates travel as JSON, so they are ISO date strings, not Dates.
export interface Post {
  id: number;
  user_id: number | null;
  caption: string | null;
  media_url: string | null;
  comment_count: number;
  created_at: string | null;
  updated_at: string | null;
  name: string | null;
  photo_url: string | null;
}

// The body of POST /api/posts. The author comes from the login token, never
// from the body. A field left out is stored as null; null means the same.
export interface CreatePostDTO {
  caption?: string | null;
  media_url?: string | null;
}

// The body of PUT /api/posts/:id. Only the fields that are sent are written;
// null clears a field. At least one field must be sent.
export interface UpdatePostDTO {
  caption?: string | null;
  media_url?: string | null;
}
