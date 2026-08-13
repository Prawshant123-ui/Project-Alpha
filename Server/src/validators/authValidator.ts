import { body, param, query } from "express-validator";

const registerValidator = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .isLength({ min: 3, max: 50 }).withMessage("Name must be between 3 and 50 characters")
    .matches(/^[a-zA-Z\s]+$/).withMessage("Name can only contain letters and spaces")
    .escape(),
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email format")
    .normalizeEmail()
    .isLength({ max: 100 }).withMessage("Email is too long"),
  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 8, max: 128 }).withMessage("Password must be between 8 and 128 characters")
    .matches(/[A-Z]/).withMessage("Must contain at least one uppercase letter")
    .matches(/[a-z]/).withMessage("Must contain at least one lowercase letter")
    .matches(/[0-9]/).withMessage("Must contain at least one number")
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage("Must contain at least one special character"),
  body("phone")
    .notEmpty().withMessage("Phone number is required")


];

const loginValidator = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Valid email required")
    .normalizeEmail(),
  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 8 }).withMessage("Invalid credentials"),
];



const createCourseValidator = [
  body("title")
    .trim()
    .notEmpty().withMessage("Title is required")
    .isLength({ min: 3, max: 150 }).withMessage("Title must be between 3 and 150 characters"),
  body("subject")
    .trim()
    .notEmpty().withMessage("Subject is required")
    .isLength({ min: 2, max: 100 }).withMessage("Subject must be between 2 and 100 characters"),
  body("description")
    .trim()
    .notEmpty().withMessage("Description is required")
    .isLength({ min: 10, max: 5000 }).withMessage("Description must be between 10 and 5000 characters"),
  body("domain")
    .trim()
    .notEmpty().withMessage("Domain is required")
    .isLength({ min: 2, max: 50 }).withMessage("Domain must be between 2 and 50 characters"),
];

const updateCourseValidator = [
  param("id")
    .notEmpty().withMessage("Course ID is required")
    .isUUID().withMessage("Invalid course ID"),
  body("title")
    .optional()
    .trim()
    .isLength({ min: 3, max: 150 }).withMessage("Title must be between 3 and 150 characters"),
  body("subject")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage("Subject must be between 2 and 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ min: 10, max: 5000 }).withMessage("Description must be between 10 and 5000 characters"),
  body("domain")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage("Domain must be between 2 and 50 characters"),
];

const courseIdValidator = [
  param("id")
    .notEmpty().withMessage("Course ID is required")
    .isUUID().withMessage("Invalid course ID"),
];

const searchCourseValidator = [
  query("q")
    .trim()
    .notEmpty().withMessage("Search keyword is required")
    .isLength({ min: 1, max: 100 }).withMessage("Keyword too long"),
];

export {
  createCourseValidator,
  updateCourseValidator,
  courseIdValidator,
  searchCourseValidator,
  registerValidator,
  loginValidator
};



