import { Request, Response } from "express";
import { CommentManager } from "@alumni/businesslogic";
import { CommentDTO } from "@alumni/dal";
import { isAdmin, isNonEmptyString, isSelf } from "../utils/requestHelpers";

const commentManager = new CommentManager();

export const createComment = async (req: Request, res: Response) => {
  try {
    // The author is the caller; a user_id in the body is ignored.
    const { post_id, content, parent_id } = req.body;
    const comment = new CommentDTO(req.user.sub, post_id, content, parent_id);
    const newComment = await commentManager.createComment(comment);
    res.status(201).json(newComment);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const getAllComments = async (req: Request, res: Response) => {
  try {
    const comments = await commentManager.getAllComments();
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const updateComment = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const existing = await commentManager.findCommentById(id);
    if (!existing) return res.status(404).json({ error: "Comment not found" });

    // Author only: an admin may delete a comment but not rewrite it.
    if (!isSelf(req, existing.user_id)) {
      return res.status(403).json({ error: "Not authorized to edit this comment" });
    }

    const content: unknown = req.body?.content;
    if (!isNonEmptyString(content)) {
      return res.status(400).json({ error: "Content is required" });
    }

    // Everything but the content comes from the stored row, never the body.
    const comment = new CommentDTO(
      existing.user_id,
      existing.posts_id,
      content,
      existing.parent_id,
    );
    comment.id = id;
    const updated = await commentManager.updateComment(comment);
    if (!updated) return res.status(404).json({ error: "Comment not found" });
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const existing = await commentManager.findCommentById(id);
    if (!existing) return res.status(404).json({ error: "Comment not found" });

    if (!isSelf(req, existing.user_id) && !isAdmin(req)) {
      return res.status(403).json({ error: "Not authorized to delete this comment" });
    }

    const comment = new CommentDTO(0, 0, "");
    comment.id = id;
    await commentManager.deleteComment(comment);
    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};
