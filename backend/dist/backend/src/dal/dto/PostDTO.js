"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostDTO = void 0;
class PostDTO {
    constructor(userId, caption, mediaUrl) {
        this.user_id = userId;
        this.caption = caption;
        this.media_url = mediaUrl;
        this.comment_count = 0;
        const now = new Date();
        this.created_at = now;
        this.updated_at = now;
    }
}
exports.PostDTO = PostDTO;
