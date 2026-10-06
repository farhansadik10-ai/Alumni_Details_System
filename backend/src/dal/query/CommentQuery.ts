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
            comments.push(comment);
        }
        return comments;
  }

  public async findCommentById(id: number): Promise<CommentDTO | undefined> {
    const info = await pool.query("SELECT * FROM comment WHERE id = $1", [id]);
    return info.rows[0];
  }

  public async updateComment(
    comment: CommentDTO,
  ): Promise<CommentDTO | undefined> {
    const info = await pool.query(
      `UPDATE comment SET content=$1, updated_at=NOW()
            WHERE id=$2 RETURNING *`,
      [comment.content, comment.id],
    );
    return info.rows[0];
  }

  /**
   * The comments of one post, oldest first, each with its author's name and
   * photo. The "User" columns are named one by one, so `password` can never
   * come along.
   */
  public async listCommentsByPost(postId: number): Promise<CommentDTO[]> {
    const info = await pool.query(
      `SELECT c.*, u.name, u.photo_url
      FROM comment c LEFT JOIN "User" u ON u.id = c.user_id
      WHERE c.posts_id = $1
      ORDER BY c.created_at ASC, c.id ASC`,
      [postId],
    );
    return info.rows;
  }

  /**
   * Deletes the comment and every reply under it, in one statement, so it is
   * all or nothing without a transaction. Returns how many rows were deleted;
   * 0 means no comment has this id.
   *
   * No foreign key cascades (gotcha G08, ADR-06). The walk starts from this
   * one comment and goes parent -> child only. UNION (not UNION ALL) drops
   * repeats, so a loop in the data cannot make it run forever.
   */
  public async deleteComment(id: number): Promise<number> {
    const info = await pool.query(
      `WITH RECURSIVE doomed AS (
        SELECT id FROM comment WHERE id = $1
        UNION
        SELECT c.id FROM comment c JOIN doomed d ON c.parent_id = d.id
      )
      DELETE FROM comment WHERE id IN (SELECT id FROM doomed)`,
      [id],
    );
    return info.rowCount ?? 0;
  }
}
