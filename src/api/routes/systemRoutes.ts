import express from "express";
import { protect, restrictTo } from "../controllers/authController";
import { resetKds } from "../controllers/systemController";
import { UserRole } from "../models/userModel";

const router = express.Router();
router.use(protect, restrictTo(UserRole.Owner)); // Owner only

// Defines the POST /api/v1/system/reset-kds endpoint
router.post("/reset-kds", resetKds);

export default router;
