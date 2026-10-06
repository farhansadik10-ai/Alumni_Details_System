import { Router } from "express";
import { createComment, getAllComments, updateComment, deleteComment } from "../controllers/CommentController";
import { authMiddleware } from "../MiddleWare/authMiddleware";

const router = Router();

router.post("/", authMiddleware, createComment);   // students, alumni, admin can all comment
router.get("/", authMiddleware, getAllComments);
router.put("/:id", authMiddleware, updateComment); // author only, content only (checked in controller)
router.delete("/:id", authMiddleware, deleteComment); // author or admin (checked in controller)

export default router;

