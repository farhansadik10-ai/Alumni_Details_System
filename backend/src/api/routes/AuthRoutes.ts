import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { handler } from "../utils/asyncHandler";

const router = Router();
const auth = new AuthController();

router.post("/login", handler(auth, "login"));                         // public

export default router;
