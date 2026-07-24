import { Router } from "express";
import {
  createPost,
  getAllPosts,
  updatePost,
  deletePost,
} from "../controllers/PostController";

const router = Router();

router.post("/", createPost);
router.get("/", getAllPosts);
router.put("/:id", updatePost);
router.delete("/:id", deletePost);

export default router;