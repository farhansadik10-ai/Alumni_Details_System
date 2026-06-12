"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostQuery = void 0;
const db_1 = __importDefault(require("../../config/db"));
class PostQuery {
    constructor() {
    }
    async createPost(data) {
        const result = await db_1.default.query(`INSERT INTO posts (user_id, caption, media_url)
            VALUES ($1, $2, $3) RETURNING *`, [data.user_id, data.caption, data.media_url]);
        return result.rows[0];
    }
    async postllPosts() {
        const result = await db_1.default.query(`SELECT * FROM posts ORDER BY created_at DESC`);
        return result.rows;
    }
    async findPostById(post) {
        const result = await db_1.default.query(`SELECT * FROM posts WHERE id=$1`, [post.id]);
        return result.rows[0] || null;
    }
    async getPostsByUserId(post) {
        const result = await db_1.default.query(`SELECT * FROM posts WHERE user_id = $1 ORDER BY created_at DESC`, [post.user_id]);
        return result.rows;
    }
    async updatePost(post) {
        const result = await db_1.default.query(`UPDATE posts SET caption=$1, media_url=$2, updated_at=NOW()
      WHERE id=$3 RETURNING *`, [post.caption, post.media_url, post.id]);
        return result.rows[0];
    }
    async deletePost(post) {
        await db_1.default.query(`DELETE FROM posts WHERE id = $1`, [post.id]);
    }
    async updateCommentCount(post) {
        await db_1.default.query(`UPDATE posts SET comment_count=$1 WHERE id=$2`, [post.comment_count, post.id]);
    }
}
exports.PostQuery = PostQuery;
