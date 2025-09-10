import express from "express";
import { protect, restrictTo } from "../controllers/authController";
import { UserRole } from "../models/userModel";

import {
  createOrder,
  getMyOrders,
  getKdsOrders,
  completeOrder,
} from "../controllers/orderController";

const router = express.Router();

// This middleware runs first, attaches `req.user`, and all subsequent
// handlers will now have access to it with the correct type.
router.use(protect);

router.get("/my-orders", restrictTo(UserRole.Waitress), getMyOrders);
router.get(
  "/kds/:station",
  restrictTo(UserRole.Kitchen, UserRole.JuiceBar),
  getKdsOrders
);
router.post("/", restrictTo(UserRole.Waitress), createOrder);
router.patch("/complete", restrictTo(UserRole.Waitress), completeOrder);

export default router;
