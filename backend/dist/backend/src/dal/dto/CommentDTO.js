"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentDTO = void 0;
class CommentDTO {
    constructor(userId, postID, content, parentID) {
        this.user_id = userId;
        this.posts_id = postID;
        this.parent_id = parentID;
        this.content = content;
        const now = new Date();
        this.created_at = now;
        this.updated_at = now;
    }
}
exports.CommentDTO = CommentDTO;
