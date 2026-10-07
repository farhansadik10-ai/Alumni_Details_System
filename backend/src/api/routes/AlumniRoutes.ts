import { Router } from "express";
import { AlumniController } from "../controllers/AlumniController";
import { authMiddleware } from "../MiddleWare/authMiddleware";
import { requireRole } from "../MiddleWare/roleMiddleware";
import { handler } from "../utils/asyncHandler";
import { ADMIN_ROLE, ALUMNI_ROLE } from "../utils/requestHelpers";

const router = Router();
const alumniController = new AlumniController();

router.post(
  "/",
  authMiddleware,
  requireRole(ALUMNI_ROLE, ADMIN_ROLE),
  handler(alumniController, "createAlumni"),
);
router.get("/", authMiddleware, handler(alumniController, "getAllAlumni"));

// The fixed paths must stay above "/:id", or Express reads "filters" and "me" as an id.
router.get("/filters", authMiddleware, handler(alumniController, "getAlumniFilters"));
router.get("/me", authMiddleware, handler(alumniController, "getMyAlumni"));
router.get("/email/:email", authMiddleware, handler(alumniController, "findAlumniByEmail"));
router.get("/:id", authMiddleware, handler(alumniController, "findAlumniById"));
router.put("/:id", authMiddleware, handler(alumniController, "updateAlumni")); // owner or admin only; checked in the controller

export default router;
