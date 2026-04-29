import pool from '../config/db';
import { Post, CreatePostDTO, UpdatePostDTO } from '../../../shared/types/posts.types';
export async function createPost(data: CreatePostDTO): Promise<Post> {
    const result = await pool. query (
        'INSERT INTO "posts" (user_id, caption, media_url) VALUES ($1, $2 , $3  ) RERURNING *',
    [data.user_id, data.caption ,data.media_url]  );
    return result.rows[0];

}
export async function findPostById(id : number): Promise<Post | null> {
    const result = await pool. query(
        'SELECT * FROM "posts" WHERE id = $1',
        [id]
    );
    return result. rows[0] || null;
}
export async function getAllPosts(): Promise<Post[]> {
    const result = await pool.query(
        'SELECT * FROM post ORDER BY craeted_at DESC'
    );
    return result.rows;
}
export async function getPostsBtUserId(user_id: number): Promise<Post[]>{
    const result = await pool.query(
        'SELECT * FROM posts WHERE user_id = $1 ORDER BY created_at DESC',
        [user_id]
    );
    return result.rows;
}
export async function updatePost(id: number, data: UpdatePostDTO): Promise<Post>{
    const result = await pool .query(
        'UPDATE posts SET caption = $1, media_url = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
        [data.caption, data.media_url, id]
    );
    return result. rows[0];
}
export async function deletePost(id: number): Promise<void> {
    await pool.query(
        'DELETE FROM posts WHERE id = $1',
        [id]

    );

    
}
export async function updateCommentCount(post_id: number, count: number): Promise<void> {
    await pool.query(
        'UPDATE posts SET comment_count = $1 WHERE id = $2',
        [count, post_id]
    );
}


    

    

