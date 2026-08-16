import { Router } from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import {
  getAllUsers,
  getUserById,
  banUser,
  unbanUser,
  deleteUser,
  moderateDeleteCourse,
} from "../controllers/adminController.js";

const router = Router();

router.use(protect, authorize("ADMIN"));

router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.patch("/users/:id/ban", banUser);
router.patch("/users/:id/unban", unbanUser);
router.delete("/users/:id", deleteUser);

router.delete("/courses/:id", moderateDeleteCourse);

export default router;