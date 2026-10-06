import { Router } from "express";
import { StatsController } from "../controllers/StatsController";
import { authMiddleware } from "../MiddleWare/authMiddleware";
import { handler } from "../utils/asyncHandler";

const router = Router();
const stats = new StatsController();

router.get("/", authMiddleware, handler(stats, "getStats"));

export default router;
