import pool from "../config/db";
import { PostDTO } from "../dto/PostDTO";
import { PageRequest, PageRows } from "./listHelpers";
import { withTransaction } from "./transaction";
import { buildUpdateSet, UpdateFields } from "./updateSet";

// The only columns an edit may write. Names are from the posts table in db/schema.md.
const POST_UPDATE_COLUMNS = ["caption", "media_url"] as const;

/** A column name `updatePost` may write. */
export type PostUpdateColumn = (typeof POST_UPDATE_COLUMNS)[number];

// The one post read. Every method that returns a post uses it, so every post
// has the same shape: the post's own columns, the author's name and photo from
// "User" (named one by one, so `password` can never come along), and
// `comment_count` counted from the comment table at read time. The stored
// posts.comment_count column is never read or written (gotcha G11).
const POST_READ = `
  SELECT p.id, p.user_id, p.caption, p.media_url, p.created_at, p.updated_at,
         u.name, u.photo_url,
         (SELECT COUNT(*)::int FROM comment c WHERE c.posts_id = p.id) AS comment_count
  FROM posts p LEFT JOIN "User" u ON u.id = p.user_id`;

export class PostQuery {
  constructor() {}

  /** Inserts the post, then returns it through the joined read. */
  public async createPost(data: PostDTO): Promise<PostDTO | undefined> {
    const result = await pool.query(
      `INSERT INTO posts (user_id, caption, media_url)
      VALUES ($1, $2, $3) RETURNING id`,
      [data.user_id, data.caption, data.media_url],
    );
    return this.findPostById(result.rows[0].id);
  }

  /** One page of posts, newest first, and how many posts there are in all. */
  public async listPosts(page: PageRequest): Promise<PageRows<PostDTO>> {
    const count = await pool.query(`SELECT COUNT(*)::int AS total FROM posts`);
    const result = await pool.query(
      `${POST_READ}
      ORDER BY p.created_at DESC, p.id DESC LIMIT $1 OFFSET $2`,
      [page.limit, page.offset],
    );
    return { rows: result.rows, total: count.rows[0].total };
  }

  public async findPostById(id: number): Promise<PostDTO | undefined> {
    const result = await pool.query(
      `${POST_READ}
      WHERE p.id = $1`,
      [id],
    );
    return result.rows[0];
  }

  /**
   * Writes only the fields present in `data`. Returns the updated post through
   * the joined read, or `undefined` when no post has this id. With nothing to
   * write it runs no UPDATE and returns the current post.
   */
  public async updatePost(
    id: number,
    data: UpdateFields<PostUpdateColumn>,
  ): Promise<PostDTO | undefined> {
    const { assignments, values } = buildUpdateSet(data, POST_UPDATE_COLUMNS);
    if (assignments.length === 0) {
      return this.findPostById(id);
    }

    const result = await pool.query(
      `UPDATE posts SET ${assignments.join(", ")}, updated_at = NOW()
      WHERE id = $${values.length + 1} RETURNING id`,
      [...values, id],
    );
    if (result.rows.length === 0) {
      return undefined;
    }
    return this.findPostById(id);
  }

  /**
   * Deletes the post together with its comments and every reply under them,
   * all or nothing. Returns whether a post row was deleted.
   *
   * No foreign key cascades (gotcha G08, ADR-06), so the comments go first.
   * Both statements run on the transaction's own `client`; `pool.query` here
   * would run outside the transaction and would not be rolled back.
   */
  public async deletePost(id: number): Promise<boolean> {
    return withTransaction(async (client) => {
      // Starts from the post's comments and walks parent -> child only.
      // UNION (not UNION ALL) drops repeats, so a loop in the data cannot
      // make the walk run forever.
      await client.query(
        `WITH RECURSIVE doomed AS (
          SELECT id FROM comment WHERE posts_id = $1
          UNION
          SELECT c.id FROM comment c JOIN doomed d ON c.parent_id = d.id
        )
        DELETE FROM comment WHERE id IN (SELECT id FROM doomed)`,
        [id],
      );
      const deleted = await client.query(`DELETE FROM posts WHERE id = $1`, [
        id,
      ]);
      return (deleted.rowCount ?? 0) > 0;
    });
  }
}
