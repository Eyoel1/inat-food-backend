import { Request, Response, NextFunction } from "express";
import MenuItem from "../models/menuItemModel";
import { uploadToCloudinary } from "../utils/cloudinary";

/**
 * @desc    Get all menu items
 * @route   GET /api/v1/menu
 * @access  Private (All authenticated staff)
 */
export const getAllMenuItems = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const menuItems = await MenuItem.find();
    res.status(200).json({
      status: "success",
      results: menuItems.length,
      data: { menuItems },
    });
  } catch (err: any) {
    // Send a generic error for GET requests
    res.status(500).json({
      status: "error",
      message: "An error occurred while fetching menu items.",
    });
  }
};

/**
 * @desc    Create a new menu item
 * @route   POST /api/v1/menu
 * @access  Private (Owner only)
 */
export const createMenuItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validation: Ensure the 'data' field exists in the multipart form.
    if (!req.body.data) {
      return res.status(400).json({
        status: "error",
        message: 'Request form is missing the required "data" field.',
      });
    }

    // The JSON data comes in as a string, so it must be parsed.
    const body = JSON.parse(req.body.data);
    let imageUrl;

    // If a file is included in the request, upload it to Cloudinary.
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file);
    }

    // Create the new document in the database with the parsed data and image URL.
    const newMenuItem = await MenuItem.create({ ...body, imageUrl });

    res.status(201).json({
      status: "success",
      data: { menuItem: newMenuItem },
    });
  } catch (err: any) {
    console.error("--- MENU ITEM CREATION FAILED (BACKEND) ---", err);
    // This is crucial: send back the specific validation error message from Mongoose.
    // This tells the frontend exactly what was wrong with the data.
    res.status(400).json({
      status: "error",
      message: err.message,
    });
  }
};

/**
 * @desc    Update an existing menu item
 * @route   PATCH /api/v1/menu/:id
 * @access  Private (Owner only)
 */
export const updateMenuItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.body.data) {
      return res.status(400).json({
        status: "error",
        message: 'Request form is missing the required "data" field.',
      });
    }

    let body = JSON.parse(req.body.data);

    // If a new file is being uploaded, handle it and add the new URL to the body.
    if (req.file) {
      body.imageUrl = await uploadToCloudinary(req.file);
    }

    // Find the item by its ID and update it with the new body data.
    // `runValidators: true` ensures our Mongoose model schema is enforced on updates.
    const menuItem = await MenuItem.findByIdAndUpdate(req.params.id, body, {
      new: true, // Return the document after the update
      runValidators: true,
    });

    if (!menuItem) {
      return res.status(404).json({
        status: "fail",
        message: `No menu item found with ID ${req.params.id}`,
      });
    }

    res.status(200).json({
      status: "success",
      data: { menuItem },
    });
  } catch (err: any) {
    console.error(
      `--- MENU ITEM UPDATE FAILED (ID: ${req.params.id}) ---`,
      err
    );
    res.status(400).json({
      status: "error",
      message: err.message,
    });
  }
};

/**
 * @desc    Delete a menu item
 * @route   DELETE /api/v1/menu/:id
 * @access  Private (Owner only)
 */
export const deleteMenuItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const menuItem = await MenuItem.findByIdAndDelete(req.params.id);

    if (!menuItem) {
      return res.status(404).json({
        status: "fail",
        message: `No menu item found with ID ${req.params.id}`,
      });
    }

    // A 204 "No Content" response is standard for a successful deletion.
    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (err: any) {
    res.status(500).json({
      status: "error",
      message: "An error occurred while deleting the menu item.",
    });
  }
};
