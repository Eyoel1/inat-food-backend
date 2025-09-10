import express from "express";
import { protect, restrictTo } from "../controllers/authController";
import { UserRole } from "../models/userModel";
import {
  createAddOn,
  getAllAddOns,
  updateAddOn,
  deleteAddOn,
} from "../controllers/addOnController";

const router = express.Router();

// All routes in this file require the user to be logged in
router.use(protect);

// Any staff member can GET the list of add-ons
router.route("/").get(getAllAddOns);

// Only the Owner can create, update, or delete add-ons
router.route("/").post(restrictTo(UserRole.Owner), createAddOn);
router.route("/:id").patch(restrictTo(UserRole.Owner), updateAddOn);
router.route("/:id").delete(restrictTo(UserRole.Owner), deleteAddOn);

export default router;
