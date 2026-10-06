import { Request, Response } from "express";
import {
  CommentManager,
  ForbiddenError,
  NotFoundError,
  PostManager,
  ValidationError,
} from "@alumni/businesslogic";
import { CommentDTO } from "@alumni/dal";
import {
  isAdmin,
  isNonEmptyString,
  isSelf,
  parseId,
} from "../utils/requestHelpers";

const POST_NOT_FOUND = "Post not found";
const COMMENT_NOT_FOUND = "Comment not found";
const CONTENT_REQUIRED = "Content is required";
const PARENT_NOT_ON_POST = "parent_id must be a comment on the same post";

export class CommentController {
  private readonly commentManager = new CommentManager();
  private readonly postManager = new PostManager();

  public async createComment(req: Request, res: Response): Promise<void> {
    // The body key is posts_id, the same name as the column and the answer.
    const postId = parseId(req.body?.posts_id, "posts_id");

    // Absent and null both mean a top-level comment.
    const sentParentId: unknown = req.body?.parent_id;
    const parentId =
      sentParentId === undefined || sentParentId === null
        ? null
        : parseId(sentParentId, "parent_id");

    // Same rule as editing a comment: text with at least one visible character.
    const content: unknown = req.body?.content;
    if (!isNonEmptyString(content)) {
      throw new ValidationError(CONTENT_REQUIRED);
    }

    const post = await this.postManager.findPostById(postId);
    if (!post) throw new NotFoundError(POST_NOT_FOUND);

    if (parentId !== null) {
      const parent = await this.commentManager.findCommentById(parentId);
      if (!parent || parent.posts_id !== postId) {
        throw new ValidationError(PARENT_NOT_ON_POST);
      }
    }

    // The author is the caller; a user_id in the body is ignored.
    const comment = new CommentDTO(
      req.user.sub,
      postId,
      content,
      parentId,
    );
    const newComment = await this.commentManager.createComment(comment);
    res.status(201).json(newComment);
  }

  public async getAllComments(req: Request, res: Response): Promise<void> {
    const comments = await this.commentManager.getAllComments();
    res.status(200).json(comments);
  }

  /** Bound in PostRoutes at GET /api/posts/:id/comments; `:id` is the post's id. */
  public async getCommentsByPost(req: Request, res: Response): Promise<void> {
    const postId = parseId(req.params.id);
    const post = await this.postManager.findPostById(postId);
    if (!post) throw new NotFoundError(POST_NOT_FOUND);

    const comments = await this.commentManager.listCommentsByPost(postId);
    res.status(200).json(comments);
  }

  public async updateComment(req: Request, res: Response): Promise<void> {
    const id = parseId(req.params.id);
    const existing = await this.commentManager.findCommentById(id);
    if (!existing) throw new NotFoundError(COMMENT_NOT_FOUND);

    // Author only: an admin may delete a comment but not rewrite it.
    if (!isSelf(req, existing.user_id)) {
      throw new ForbiddenError("Not authorized to edit this comment");
    }

    const content: unknown = req.body?.content;
    if (!isNonEmptyString(content)) {
      throw new ValidationError(CONTENT_REQUIRED);
    }

    // Everything but the content comes from the stored row, never the body.
    const comment = new CommentDTO(
      existing.user_id,
      existing.posts_id,
      content,
      existing.parent_id,
    );
    comment.id = id;
    const updated = await this.commentManager.updateComment(comment);
    if (!updated) throw new NotFoundError(COMMENT_NOT_FOUND);
    res.status(200).json(updated);
  }

  public async deleteComment(req: Request, res: Response): Promise<void> {
    const id = parseId(req.params.id);
    const existing = await this.commentManager.findCommentById(id);
    if (!existing) throw new NotFoundError(COMMENT_NOT_FOUND);

    if (!isSelf(req, existing.user_id) && !isAdmin(req)) {
      throw new ForbiddenError("Not authorized to delete this comment");
    }

    // The comment and every reply under it go in one statement (ADR-06).
    const deletedCount = await this.commentManager.deleteComment(id);
    if (deletedCount === 0) throw new NotFoundError(COMMENT_NOT_FOUND);
    res.status(200).json({ message: "Comment deleted successfully" });
  }
}
