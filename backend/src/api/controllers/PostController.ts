import { Request, Response } from "express";
import {
  ForbiddenError,
  NotFoundError,
  PostManager,
  ValidationError,
} from "@alumni/businesslogic";
import { PostDTO } from "@alumni/dal";
import {
  checkFields,
  isAdmin,
  isSelf,
  isStringOrNull,
  NO_FIELDS_MESSAGE,
  parseId,
  parsePaging,
  pickSent,
  textOrNull,
} from "../utils/requestHelpers";

// The only body keys a create or an edit may set. user_id, id and anything else are dropped.
const POST_FIELDS = ["caption", "media_url"] as const;
const POST_FIELD_RULES = {
  caption: isStringOrNull,
  media_url: isStringOrNull,
};

const POST_NOT_FOUND = "Post not found";
const POST_NOT_READ_BACK = "Created post could not be read back";
const NOT_POST_EDITOR = "Not authorized to edit this post";
const NOT_POST_DELETER = "Not authorized to delete this post";
const POST_DELETED = "Post deleted successfully";

export class PostController {
  private readonly postManager = new PostManager();

  public async createPost(req: Request, res: Response): Promise<void> {
    const fields = checkFields(pickSent(req.body, POST_FIELDS), POST_FIELD_RULES);

    // The author is the caller; a user_id in the body is ignored.
    const post = new PostDTO(
      req.user.sub,
      textOrNull(fields.caption),
      textOrNull(fields.media_url),
    );
    const newPost = await this.postManager.createNewPost(post);
    if (!newPost) {
      // The insert went through but the row could not be read back.
      throw new Error(POST_NOT_READ_BACK);
    }
    res.status(201).json(newPost);
  }

  public async getAllPosts(req: Request, res: Response): Promise<void> {
    const { page, limit, offset } = parsePaging(req.query);
    const { rows, total } = await this.postManager.listPosts({ limit, offset });
    res.status(200).json({ items: rows, total, page, limit });
  }

  // Not bound to a route (gotcha G33).
  public async findPostById(req: Request, res: Response): Promise<void> {
    const id = parseId(req.params.id);
    const post = await this.postManager.findPostById(id);
    if (!post) throw new NotFoundError(POST_NOT_FOUND);
    res.status(200).json(post);
  }

  public async updatePost(req: Request, res: Response): Promise<void> {
    const id = parseId(req.params.id);
    const existing = await this.postManager.findPostById(id);
    if (!existing) throw new NotFoundError(POST_NOT_FOUND);

    // Author only. An admin may delete any post but edit only their own (ADR-02).
    if (!isSelf(req, existing.user_id)) {
      throw new ForbiddenError(NOT_POST_EDITOR);
    }

    const sent = pickSent(req.body, POST_FIELDS);
    if (Object.keys(sent).length === 0) {
      throw new ValidationError(NO_FIELDS_MESSAGE);
    }
    const fields = checkFields(sent, POST_FIELD_RULES);

    const updated = await this.postManager.updatePost(id, fields);
    if (!updated) throw new NotFoundError(POST_NOT_FOUND);
    res.status(200).json(updated);
  }

  public async deletePost(req: Request, res: Response): Promise<void> {
    const id = parseId(req.params.id);
    const existing = await this.postManager.findPostById(id);
    if (!existing) throw new NotFoundError(POST_NOT_FOUND);

    // Author or admin (ADR-02).
    if (!isSelf(req, existing.user_id) && !isAdmin(req)) {
      throw new ForbiddenError(NOT_POST_DELETER);
    }

    // The post and its comments and replies go together, or not at all (ADR-06).
    const deleted = await this.postManager.deletePost(id);
    if (!deleted) throw new NotFoundError(POST_NOT_FOUND);
    res.status(200).json({ message: POST_DELETED });
  }
}
