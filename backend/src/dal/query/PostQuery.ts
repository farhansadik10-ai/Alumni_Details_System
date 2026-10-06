import pool from "../config/db";
import { PostDTO } from "../dto/PostDTO";
import { buildUpdateSet } from "./updateSet";

// The only columns an edit may write. Names are from the posts table in db/schema.md.
const POST_UPDATE_COLUMNS = ["caption", "media_url"] as const;

export class PostQuery {
  constructor() {}
  public async createPost(data: PostDTO): Promise<PostDTO> {
    const result: any = await pool.query(
      `INSERT INTO posts (user_id, caption, media_url)
            VALUES ($1, $2, $3) RETURNING *`,
      [data.user_id, data.caption, data.media_url],
    );
    return result.rows[0];
  }

    public async getAllPosts(): Promise<PostDTO[]> {
        const info = await pool.query(
            'SELECT * FROM posts ORDER BY created_at DESC'
        );
        const posts: PostDTO[] = [];
        for (const post of info.rows) {
            console.log(post);
            posts.push(post);
        }
        return posts;
    }
  public async findPostById(id: number): Promise<PostDTO | null> {
    const result = await pool.query(`SELECT * FROM posts WHERE id=$1`, [id]);
    return result.rows[0] || null;
  }
  public async getPostsByUserId(post: PostDTO): Promise<PostDTO[]> {
    const result = await pool.query(
      `SELECT * FROM posts WHERE user_id = $1 ORDER BY created_at DESC`,
      [post.user_id],
    );
    return result.rows;
  }
  /**
   * Writes only the fields present in `data`. Returns the updated row, or
   * `null` when no post has this id. With nothing to write it runs no UPDATE
   * and returns the current row.
   */
  public async updatePost(
    id: number,
    data: Partial<PostDTO>,
  ): Promise<PostDTO | null> {
    const { assignments, values } = buildUpdateSet(
      data as Record<string, unknown>,
      POST_UPDATE_COLUMNS,
    );
    if (assignments.length === 0) {
      return this.findPostById(id);
    }

    const result = await pool.query(
      `UPDATE posts SET ${assignments.join(", ")}, updated_at = NOW()
      WHERE id = $${values.length + 1} RETURNING *`,
      [...values, id],
    );
    return result.rows[0] || null;
  }
  public async deletePost(post: PostDTO): Promise<void> {
    await pool.query(`DELETE FROM posts WHERE id = $1`, [post.id]);
  }
  public async updateCommentCount(post: PostDTO): Promise<void> {
    await pool.query(`UPDATE posts SET comment_count=$1 WHERE id=$2`, [
      post.comment_count,
      post.id,
    ]);
  }
}
