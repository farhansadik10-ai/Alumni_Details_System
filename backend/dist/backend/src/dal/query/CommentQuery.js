"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentQuery = void 0;
const db_1 = __importDefault(require("../../config/db"));
class CommentQuery {
    constructor() {
    }
    async createComment(comment) {
        const info = await db_1.default.query('INSERT INTO comment (user_id, post_id,parent_id,content)VALUES ($1,$2,$3,$4) RETURNING * ', [
            comment.user_id,
            comment.posts_id,
            comment.parent_id,
            comment.content
        ]);
        return info.rows[0];
    }
    async getAllComments() {
        const info = await db_1.default.query('SELECT * FROM comments ORDER BY created_at DESC');
        return info.rows;
    }
    async updatePost(comment) {
        const info = await db_1.default.query(`UPDATE posts SET content=$1 updated_at=NOW()
            WHERE id=$2 RETURNING *`, [
            comment.content,
            comment.id
        ]);
        return info.rows[0];
    }
    async deletePost(comment) {
        await db_1.default.query('DELETE FROM comments WHERE id = $1', [
            comment.id
        ]);
    }
}
exports.CommentQuery = CommentQuery;
