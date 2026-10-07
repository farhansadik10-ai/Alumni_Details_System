import pool from "../config/db";
import { CommentDTO } from "../dto/CommentDTO";
import { withTransaction } from "./transaction";

// The one joined comment read: the comment's own columns plus its author's
// name and photo. The "User" columns are named one by one (never u.*), so
// `password` can never come along. Create, update and the list of a post's
// comments all return this shape, and so does every other comment read.
const COMMENT_READ = `
  SELECT c.*, u.name, u.photo_url
  FROM comment c LEFT JOIN "User" u ON u.id = c.user_id`;

export class CommentQuery {
  constructor() {}

  /**
   * Inserts the comment, then returns it through the joined read.
   *
   * Both statements run on one transaction's client, so the re-read always
   * finds the row: nothing else can see or delete it before the commit.
   */
  public async createComment(comment: CommentDTO): Promise<CommentDTO> {
    return withTransaction(async (client) => {
      const inserted = await client.query(
        `INSERT INTO comment (user_id, posts_id, parent_id, content)
        VALUES ($1, $2, $3, $4) RETURNING id`,
        [comment.user_id, comment.posts_id, comment.parent_id, comment.content],
      );
      const info = await client.query(
        `${COMMENT_READ}
        WHERE c.id = $1`,
        [inserted.rows[0].id],
      );
      return info.rows[0];
    });
  }
  /** Every comment, newest first; the id breaks a tie so the order is fixed. */
  public async getAllComments(): Promise<CommentDTO[]> {
    const info = await pool.query(
      `${COMMENT_READ}
      ORDER BY c.created_at DESC, c.id DESC`,
    );
    return info.rows;
  }

  public async findCommentById(id: number): Promise<CommentDTO | undefined> {
    const info = await pool.query(
      `${COMMENT_READ}
      WHERE c.id = $1`,
      [id],
    );
    return info.rows[0];
  }

  /**
   * Writes the new content, then returns the comment through the joined read.
   * Returns `undefined` when no comment has this id.
   */
  public async updateComment(
    comment: CommentDTO,
  ): Promise<CommentDTO | undefined> {
    const updated = await pool.query(
      `UPDATE comment SET content = $1, updated_at = NOW()
      WHERE id = $2 RETURNING id`,
      [comment.content, comment.id],
    );
    if (updated.rows.length === 0) {
      return undefined;
    }
    const info = await pool.query(
      `${COMMENT_READ}
      WHERE c.id = $1`,
      [updated.rows[0].id],
    );
    return info.rows[0];
  }

  /**
   * The comments of one post, oldest first, each with its author's name and
   * photo.
   */
  public async listCommentsByPost(postId: number): Promise<CommentDTO[]> {
    const info = await pool.query(
      `${COMMENT_READ}
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
