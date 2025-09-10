import express from "express";
import {
  createUser,
  getAllUsers,
  getMe,
  updateUser,
  deleteUser,
} from "../controllers/userController"; // Add imports
import { login, protect, restrictTo } from "../controllers/authController";
import { UserRole } from "../models/userModel";

const router = express.Router();
router.post("/login", login);
router.get("/me", protect, getMe);
router
  .route("/")
  .get(protect, restrictTo(UserRole.Owner), getAllUsers)
  .post(protect, restrictTo(UserRole.Owner), createUser);

// --- ADDED ROUTES ---
router
  .route("/:id")
  .patch(protect, restrictTo(UserRole.Owner), updateUser)
  .delete(protect, restrictTo(UserRole.Owner), deleteUser);

export default router;
