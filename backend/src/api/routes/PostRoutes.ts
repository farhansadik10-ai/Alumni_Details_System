import { Router } from "express";
import { PostController } from "../controllers/PostController";
import { CommentController } from "../controllers/CommentController";
import { authMiddleware } from "../MiddleWare/authMiddleware";
import { requireRole } from "../MiddleWare/roleMiddleware";
import { handler } from "../utils/asyncHandler";

const router = Router();
const posts = new PostController();
const comments = new CommentController();

router.post("/", authMiddleware, requireRole("alumni", "admin"), handler(posts, "createPost"));
router.get("/", authMiddleware, handler(posts, "getAllPosts"));
router.get("/:id/comments", authMiddleware, handler(comments, "getCommentsByPost"));
router.put("/:id", authMiddleware, handler(posts, "updatePost"));   // author only, even for admins (ADR-02); checked in the controller
router.delete("/:id", authMiddleware, handler(posts, "deletePost")); // author or admin; checked in the controller

export default router;
