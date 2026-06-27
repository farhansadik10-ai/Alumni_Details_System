import pool from "../config/db";
import { CommentDTO } from "../dto/CommentDTO";

export class CommentQuery {
  constructor() {}
  public async createComment(comment: CommentDTO): Promise<CommentDTO> {
    const info = await pool.query(
      "INSERT INTO comment (user_id, posts_id,parent_id,content)VALUES ($1,$2,$3,$4) RETURNING * ",
      [comment.user_id, comment.posts_id, comment.parent_id, comment.content],
    );
    return info.rows[0];
  }
  public async getAllComments(): Promise<CommentDTO[]> {
    const info = await pool.query(
      "SELECT * FROM comment ORDER BY created_at DESC",
    );
     const comments: CommentDTO[] = [];
        for (const comment of info.rows) {
            console.log(comment);
            comments.push(comment);
        }
        return comments;
  }

  public async updateComment(comment: CommentDTO): Promise<CommentDTO> {
    const info = await pool.query(
      `UPDATE comments SET content=$1 updated_at=NOW()
            WHERE id=$2 RETURNING *`,
      [comment.content, comment.id],
    );
    return info.rows[0];
  }

  public async deleteComment(comment: CommentDTO): Promise<void> {
    await pool.query("DELETE FROM comments WHERE id = $1", [comment.id]);
  }
}
