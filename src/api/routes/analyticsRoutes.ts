import express from "express";
import { protect, restrictTo } from "../controllers/authController";
import {
  getSalesAnalyticsByWaitress,
  resetSalesAnalytics,
} from "../controllers/analyticsController";
import { UserRole } from "../models/userModel";

const router = express.Router();
router.use(protect, restrictTo(UserRole.Owner));

router.get("/sales", getSalesAnalyticsByWaitress);
router.delete("/sales", resetSalesAnalytics); // <-- The reset endpoint

export default router;
