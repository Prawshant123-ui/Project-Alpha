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



export {
  registerValidator,
  loginValidator
};



