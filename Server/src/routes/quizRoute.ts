import { Router } from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import { validateRequest } from "../validators/validate.js";
import {
  courseIdParamValidator,
  quizIdParamValidator,
  createQuizValidator,
  addQuestionValidator,
  updateQuestionValidator,
  submitAttemptValidator,
} from "../validators/quizValidator.js";
import {
  createQuiz,
  deleteQuiz,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  getQuizForAttempt,
  submitQuizAttempt,
} from "../controllers/quizController.js";

const router = Router();

// ---------- Mentor: quiz management ----------
router.post(
  "/course/:courseId",
  protect,
  authorize("MENTOR", "ADMIN"),
  createQuizValidator,
  validateRequest,
  createQuiz
);

router.delete("/:quizId", protect, authorize("MENTOR", "ADMIN"), quizIdParamValidator, validateRequest, deleteQuiz);

router.post(
  "/:quizId/questions",
  protect,
  authorize("MENTOR", "ADMIN"),
  addQuestionValidator,
  validateRequest,
  addQuestion
);

router.patch(
  "/questions/:questionId",
  protect,
  authorize("MENTOR", "ADMIN"),
  updateQuestionValidator,
  validateRequest,
  updateQuestion
);

router.delete("/questions/:questionId", protect, authorize("MENTOR", "ADMIN"), deleteQuestion);

// ---------- Student: take quiz ----------
router.get(
  "/course/:courseId",
  protect,
  courseIdParamValidator,
  validateRequest,
  getQuizForAttempt
);

router.post(
  "/:quizId/attempt",
  protect,
  authorize("STUDENT"),
  submitAttemptValidator,
  validateRequest,
  submitQuizAttempt
);

export default router;
