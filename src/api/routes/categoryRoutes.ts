import express from "express";
import { protect, restrictTo } from "../controllers/authController";
import { UserRole } from "../models/userModel";
import {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController";

const router = express.Router();

// --- Apply Authentication Middleware ---
// ALL routes in this file will require the user to be logged in.
router.use(protect);

// --- Define Routes ---

// The GET route is accessible to any logged-in staff member.
// Waitresses and kitchen staff need to be able to see the categories to view the menu.
router.route("/").get(getAllCategories);

// The POST, PATCH, and DELETE routes are restricted to the Owner role only.
router.route("/").post(restrictTo(UserRole.Owner), createCategory);
router.route("/:id").patch(restrictTo(UserRole.Owner), updateCategory);
router.route("/:id").delete(restrictTo(UserRole.Owner), deleteCategory);

export default router;
