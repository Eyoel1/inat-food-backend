import express from "express";
import { protect, restrictTo } from "../controllers/authController";
import { UserRole } from "../models/userModel";
import {
  createMenuItem,
  getAllMenuItems,
  updateMenuItem,
  deleteMenuItem,
  // You might also add a getSingleMenuItem controller if needed
} from "../controllers/menuController";
import { upload } from "../utils/cloudinary"; // Import the Multer upload middleware

const router = express.Router();

// --- Apply Authentication Middleware ---
// ALL routes in this file will require the user to be logged in first.
router.use(protect);

// --- Define Routes ---

// The GET route is accessible to any logged-in staff member.
// Waitresses, kitchen staff, etc., all need to be able to view the menu.
router.route("/").get(getAllMenuItems);

// To get details of a single item, you might have a route like this:
// router.route('/:id').get(getSingleMenuItem);

// --- Apply Authorization Middleware ---
// ALL routes below this point are restricted to the Owner role only.
router.use(restrictTo(UserRole.Owner));

router
  .route("/")
  // This middleware stack runs in order:
  // 1. `protect` (from above) checks for a valid token.
  // 2. `restrictTo` checks if the user's role is 'Owner'.
  // 3. `upload.single('image')` processes a potential file upload from a field named 'image'.
  // 4. `createMenuItem` controller logic runs.
  .post(upload.single("image"), createMenuItem);

router
  .route("/:id")
  // The same middleware logic applies to updating an item.
  .patch(upload.single("image"), updateMenuItem)
  // Deleting does not require file upload middleware.
  .delete(deleteMenuItem);

export default router;
