import { Router } from "express";
import {
  createUser,
  getAllUsers,
  findUserById,
  findUserByEmail,
  updateUser,
  deleteUser,
  updateLogoutTime,
} from "../controllers/UserController";
import { authMiddleware } from "../MiddleWare/authMiddleware";
import { requireRole } from "../MiddleWare/roleMiddleware";

const router = Router();

router.post("/", createUser);                                          // signup — public
router.get("/", authMiddleware, requireRole("admin"), getAllUsers);    // admin only — full user list
router.get("/:id", authMiddleware, findUserById);                      // any logged-in user
router.get("/email/:email", authMiddleware, requireRole("admin"), findUserByEmail);
router.put("/:id", authMiddleware, updateUser);                        // self or admin — checked in the controller
router.delete("/:id", authMiddleware, requireRole("admin"), deleteUser);
router.put("/:id/logout", authMiddleware, updateLogoutTime);           // self only — checked in the controller

export default router;