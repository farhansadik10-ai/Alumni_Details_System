import { Router } from "express";
import { CommentController } from "../controllers/CommentController";
import { authMiddleware } from "../MiddleWare/authMiddleware";
import { handler } from "../utils/asyncHandler";

const router = Router();
const comments = new CommentController();

router.post("/", authMiddleware, handler(comments, "createComment"));   // students, alumni, admin can all comment
router.get("/", authMiddleware, handler(comments, "getAllComments"));
router.put("/:id", authMiddleware, handler(comments, "updateComment")); // author only, content only (checked in controller)
router.delete("/:id", authMiddleware, handler(comments, "deleteComment")); // author or admin (checked in controller)

export default router;
