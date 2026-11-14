
import { CommentDTO, CommentQuery } from "@alumni/dal";

export class CommentManager {
  commentQuery: CommentQuery;

  constructor() {
    this.commentQuery = new CommentQuery();
  }
  public async createComment(comment: CommentDTO) {
    const newComment = await this.commentQuery.createComment(comment);
    return newComment;
  }

  public async updateComment(comment: CommentDTO) {
    const newUpdateComment = await this.commentQuery.updateComment(comment);
    return newUpdateComment;
  }
  /** Deletes the comment and every reply under it. Returns how many rows went; 0 when no comment has this id. */
  public async deleteComment(id: number) {
    const deletedCount = await this.commentQuery.deleteComment(id);
    return deletedCount;
  }
  public async listCommentsByPost(postId: number) {
    const comments = await this.commentQuery.listCommentsByPost(postId);
    return comments;
  }
  public async findCommentById(id: number) {
    const comment = await this.commentQuery.findCommentById(id);
    return comment;
  }
  public async getAllComments() {
    const allComments = await this.commentQuery.getAllComments();
    return allComments;
  }
}