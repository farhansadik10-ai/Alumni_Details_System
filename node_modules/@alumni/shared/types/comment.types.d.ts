export interface Comment {
    id: number;
    user_id: number;
    posts_id: number;
    parent_id?: number;
    content: string;
    created_at?: Date;
    updated_at?: Date;
}
export interface CreateCommentDTO {
    user_id: number;
    posts_id: number;
    parent_id?: number;
    content: string;
}
export interface UpdateCommentDTO {
    content: string;
}
//# sourceMappingURL=comment.types.d.ts.map