import { Router } from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";
import { validateRequest } from "../validators/validate.js"
import {
  createCourseValidator,
  updateCourseValidator,
  courseIdValidator,
  searchCourseValidator,
} from "../validators/courseValidator.js";
import {
  createCourse,
  getAllCourse,
  getCourseById,
  updateCourse,
  deleteCourse,
  searchCourse,
  getCoursesByDomain,
} from "../controllers/courseController.js";

const router = Router();

const courseFileUpload = upload.fields([
  { name: "notePdfUrl", maxCount: 1 },
  { name: "thumbnailImageUrl", maxCount: 1 },
  { name: "videoUrl", maxCount: 1 },
]);


router.get("/", protect, getAllCourse);
router.get("/search", protect, searchCourseValidator, validateRequest, searchCourse);
router.get("/domain/:domain", protect, getCoursesByDomain);
router.get("/:id", protect, courseIdValidator, validateRequest, getCourseById);


router.post(
  "/",
  protect,
  authorize("MENTOR", "ADMIN"),
  courseFileUpload,
  createCourseValidator,
  validateRequest,
  createCourse
);

router.patch(
  "/:id",
  protect,
  authorize("MENTOR", "ADMIN"),
  courseFileUpload,
  updateCourseValidator,
  validateRequest,
  updateCourse
);

router.delete(
  "/:id",
  protect,
  authorize("MENTOR", "ADMIN"),
  courseIdValidator,
  validateRequest,
  deleteCourse
);

export default router;