export interface Post {
    id: number;
    user_id: number;
    caption?: string;
    media_url?: string;
    comment_count?: number;
    created_at?: Date;
    updated_at?: Date;
}
export interface CreatePostDTO {
    user_id: number;
    caption?: string;
    media_url?: string;
}
export interface UpdatePostDTO {
    caption?: string;
    media_url?: string;
}
//# sourceMappingURL=posts.types.d.ts.map