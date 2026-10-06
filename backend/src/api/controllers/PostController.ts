import { Request, Response } from "express";
import { PostManager } from "@alumni/businesslogic";
import { PostDTO } from "@alumni/dal";
import {
  findWrongType,
  isAdmin,
  isSelf,
  isStringOrNull,
  pickSent,
} from "../utils/requestHelpers";

const postManager = new PostManager();

// The only body keys an edit may change. user_id, id and anything else are dropped.
const POST_UPDATE_FIELDS = ["caption", "media_url"] as const;

export const createPost = async (req: Request, res: Response) => {
  try {
    const { caption, media_url } = req.body;
    const post = new PostDTO(req.user.sub, caption, media_url);
    const newPost = await postManager.createNewPost(post);
    res.status(201).json(newPost);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const getAllPosts = async (req: Request, res: Response) => {
  try {
    const posts = await postManager.getAllPosts();
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const findPostById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const post = await postManager.findPostById(id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    res.status(200).json(post);
  } catch (error) {
    res.status(404).json({ error: (error as Error).message });
  }
};

export const updatePost = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const existing = await postManager.findPostById(id);
    if (!existing) return res.status(404).json({ error: "Post not found" });

    // Author only. An admin may delete any post but edit only their own (ADR-02).
    if (!isSelf(req, existing.user_id)) {
      return res.status(403).json({ error: "Not authorized to edit this post" });
    }

    const fields = pickSent(req.body, POST_UPDATE_FIELDS);
    if (Object.keys(fields).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }
    const wrongField = findWrongType(fields, isStringOrNull);
    if (wrongField) {
      return res.status(400).json({ error: `${wrongField} has the wrong type` });
    }

    const updated = await postManager.updatePost(id, fields as Partial<PostDTO>);
    if (!updated) return res.status(404).json({ error: "Post not found" });
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const deletePost = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const existing = await postManager.findPostById(id);
    if (!existing) return res.status(404).json({ error: "Post not found" });

    // Author or admin (ADR-02).
    if (!isSelf(req, existing.user_id) && !isAdmin(req)) {
      return res.status(403).json({ error: "Not authorized to delete this post" });
    }

    const post = new PostDTO(0);
    post.id = id;
    await postManager.deletePost(post);
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};