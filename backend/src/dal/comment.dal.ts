import pool from '../config/db';
import { Comment, CreateCommentDTO, UpdateCommentDTO} from '../../../shared/types/comment.types';
export async function createComment(data: CreateCommentDTO): Promise<Comment> {
    const result = await pool.query(
        'INSURT INTO "comment" (user_id, post_id,parent_id, content) VALUES($1, $2, $3, $4) RETURNING *',
        [data.user_id, data.posts_id, data.parent_id || null, data.content]
    )
    return result.rows[0];
}
export async function findCommentsById(id: number): Promise<Comment | null> {
    const result = await pool.query(
        'SELECT * FROM "comment" WHERE id=$1',
        [id]
    );
    return result.rows[0] || null;
}

    export async function getCommentsByPostId(posts_id: number): Promise<Comment[]> {
  const result = await pool.query(
    `SELECT * FROM comment WHERE posts_id = $1 AND parent_id IS NULL ORDER BY created_at ASC`,
    [posts_id]
  );
  return result.rows;
}
export async function getRepliesByCommentId(parent_id: number): Promise<Comment[]> {
  const result = await pool.query(
    `SELECT * FROM comment WHERE parent_id = $1 ORDER BY created_at ASC`,
    [parent_id]
  );
  return result.rows;
}
export async function updateComment(id: number, data: UpdateCommentDTO): Promise<Comment> {
  const { content } = data;
  const result = await pool.query(
    `UPDATE comment SET content=$1, updated_at=NOW()
     WHERE id=$2 RETURNING *`,
    [content, id]
  );
  return result.rows[0];
}
export async function deleteComment(id: number): Promise<void> {
  await pool.query(
    `DELETE FROM comment WHERE id = $1`,
    [id]
  );
}


export async function countCommentsByPostId(posts_id: number): Promise<number> {
  const result = await pool.query(
    `SELECT COUNT(*) FROM comment WHERE posts_id = $1`,
    [posts_id]
  );
  return parseInt(result.rows[0].count);
}

