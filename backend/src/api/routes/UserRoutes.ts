import { Router } from "express";
import { UserController } from "../controllers/UserController";
import { authMiddleware } from "../MiddleWare/authMiddleware";
import { requireRole } from "../MiddleWare/roleMiddleware";
import { handler } from "../utils/asyncHandler";
import { ADMIN_ROLE } from "../utils/requestHelpers";

const router = Router();
const users = new UserController();

router.post("/", handler(users, "createUser"));                                          // signup — public
router.get("/", authMiddleware, requireRole(ADMIN_ROLE), handler(users, "getAllUsers"));    // admin only — full user list
router.get("/:id", authMiddleware, handler(users, "findUserById"));                      // any logged-in user
router.get("/email/:email", authMiddleware, requireRole(ADMIN_ROLE), handler(users, "findUserByEmail"));
router.put("/:id", authMiddleware, handler(users, "updateUser"));                        // self or admin — checked in the controller
router.delete("/:id", authMiddleware, requireRole(ADMIN_ROLE), handler(users, "deleteUser"));
router.put("/:id/logout", authMiddleware, handler(users, "updateLogoutTime"));           // self only — checked in the controller

export default router;
