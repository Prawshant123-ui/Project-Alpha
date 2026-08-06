import { Router } from "express";
import { registerUser, loginUser, getCurrentUser } from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { registerValidator, loginValidator } from "../validators/authValidator.js"; 
const router = Router();

router.post("/register", registerValidator, registerUser);
router.post("/login", loginValidator, loginUser);
router.get("/me", protect, getCurrentUser);

export default router;
