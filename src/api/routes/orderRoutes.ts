import express from "express";
import { protect, restrictTo } from "../controllers/authController";
import { UserRole } from "../models/userModel";

// We only import controllers that are called via HTTP requests.
import {
  createOrder,
  getMyOrders,
  getKdsOrders,
  completeOrder,
} from "../controllers/orderController";

const router = express.Router();

// Apply `protect` middleware to all routes in this file,
// ensuring a user must be logged in to access them.
router.use(protect);

// --- GET Routes ---
// For a waitress to fetch her list of active orders.
router.get("/my-orders", restrictTo(UserRole.Waitress), getMyOrders);
// For a KDS screen (Kitchen or JuiceBar) to fetch its initial list of active orders.
router.get(
  "/kds/:station",
  restrictTo(UserRole.Kitchen, UserRole.JuiceBar),
  getKdsOrders
);

// --- POST Routes ---
// For a waitress to submit a new order.
router.post("/", restrictTo(UserRole.Waitress), createOrder);

// --- PATCH Routes ---
// For a waitress to mark an order as "Completed" after payment.
router.patch("/complete", restrictTo(UserRole.Waitress), completeOrder);

export default router;
