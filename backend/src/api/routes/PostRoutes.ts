import { Router } from "express";
import {
  createPost,
  getAllPosts,
  updatePost,
  deletePost,
} from "../controllers/PostController";
import { authMiddleware } from "../MiddleWare/authMiddleware";
import { requireRole } from "../MiddleWare/roleMiddleware";

const router = Router();

router.post("/", authMiddleware, requireRole("alumni", "admin"), createPost);
router.get("/", authMiddleware, getAllPosts);
router.put("/:id", authMiddleware, updatePost);   // author only, even for admins (ADR-02); checked in the controller
router.delete("/:id", authMiddleware, deletePost); // author or admin; checked in the controller

export default router;