import { Router } from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import { param } from "express-validator";
import { validateRequest } from "../validators/validate.js";
import {
  getStudentProgress,
  getLeaderboard,
  getTeacherDashboard,
  getAdminDashboard,
} from "../controllers/resultController.js";

const router = Router();

const courseIdParamValidator = [
  param("courseId").notEmpty().withMessage("Course ID is required").isUUID().withMessage("Invalid course ID"),
];

router.get("/progress", protect, authorize("STUDENT"), getStudentProgress);

router.get(
  "/leaderboard/:courseId",
  protect,
  courseIdParamValidator,
  validateRequest,
  getLeaderboard
);

router.get("/teacher/dashboard", protect, authorize("MENTOR", "ADMIN"), getTeacherDashboard);

router.get("/admin/dashboard", protect, authorize("ADMIN"), getAdminDashboard);

export default router;
