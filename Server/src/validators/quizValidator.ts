import { body, param } from "express-validator";

const courseIdParamValidator = [
  param("courseId").notEmpty().withMessage("Course ID is required").isUUID().withMessage("Invalid course ID"),
];

const quizIdParamValidator = [
  param("quizId").notEmpty().withMessage("Quiz ID is required").isUUID().withMessage("Invalid quiz ID"),
];

const questionIdParamValidator = [
  param("questionId").notEmpty().withMessage("Question ID is required").isUUID().withMessage("Invalid question ID"),
];

const createQuizValidator = [
  ...courseIdParamValidator,
  body("title").optional().trim().isLength({ max: 150 }).withMessage("Title too long"),
];

const addQuestionValidator = [
  ...quizIdParamValidator,
  body("text").trim().notEmpty().withMessage("Question text is required"),
  body("options").isArray({ min: 2, max: 6 }).withMessage("Provide between 2 and 6 options"),
  body("options.*.text").trim().notEmpty().withMessage("Option text is required"),
  body("options.*.isCorrect").isBoolean().withMessage("isCorrect must be true or false"),
];

const updateQuestionValidator = [
  ...questionIdParamValidator,
  body("text").optional().trim().notEmpty().withMessage("Question text cannot be empty"),
  body("options").optional().isArray({ min: 2, max: 6 }).withMessage("Provide between 2 and 6 options"),
  body("options.*.text").optional().trim().notEmpty().withMessage("Option text is required"),
  body("options.*.isCorrect").optional().isBoolean().withMessage("isCorrect must be true or false"),
];

const submitAttemptValidator = [
  ...quizIdParamValidator,
  body("answers").isObject().withMessage("Answers must be an object of { questionId: optionId }"),
];

export {
  courseIdParamValidator,
  quizIdParamValidator,
  questionIdParamValidator,
  createQuizValidator,
  addQuestionValidator,
  updateQuestionValidator,
  submitAttemptValidator,
};
