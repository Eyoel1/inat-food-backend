import { Request, Response, NextFunction } from "express";
import MenuItem from "../models/menuItemModel";
import { uploadToCloudinary } from "../utils/cloudinary";

export const getAllMenuItems = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const menuItems = await MenuItem.find();
    res
      .status(200)
      .json({
        status: "success",
        results: menuItems.length,
        data: { menuItems },
      });
  } catch (err: any) {
    res
      .status(500)
      .json({
        status: "error",
        message: "An error occurred while fetching menu items.",
      });
  }
};

export const createMenuItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.body.data) {
      return res
        .status(400)
        .json({
          status: "error",
          message: 'Request is missing the "data" field in the form.',
        });
    }

    const body = JSON.parse(req.body.data);
    let imageUrl;
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file);
    }

    const newMenuItem = await MenuItem.create({ ...body, imageUrl });

    res
      .status(201)
      .json({ status: "success", data: { menuItem: newMenuItem } });
  } catch (err: any) {
    console.error("--- MENU ITEM CREATION FAILED ---", err);
    // This is the key change: send back the detailed Mongoose error.
    res.status(400).json({ status: "error", message: err.message });
  }
};

export const updateMenuItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.body.data) {
      return res
        .status(400)
        .json({
          status: "error",
          message: 'Request is missing the "data" field in the form.',
        });
    }
    let body = JSON.parse(req.body.data);
    let imageUrl;
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file);
      body.imageUrl = imageUrl;
    }

    const menuItem = await MenuItem.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true,
    });
    if (!menuItem) {
      return res
        .status(404)
        .json({
          status: "fail",
          message: `No menu item found with ID ${req.params.id}`,
        });
    }
    res.status(200).json({ status: "success", data: { menuItem } });
  } catch (err: any) {
    console.error(
      `--- MENU ITEM UPDATE FAILED (ID: ${req.params.id}) ---`,
      err
    );
    res.status(400).json({ status: "error", message: err.message });
  }
};

export const deleteMenuItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const menuItem = await MenuItem.findByIdAndDelete(req.params.id);
    if (!menuItem) {
      return res
        .status(404)
        .json({
          status: "fail",
          message: `No menu item found with ID ${req.params.id}`,
        });
    }
    res.status(204).json({ status: "success", data: null });
  } catch (err: any) {
    res
      .status(500)
      .json({
        status: "error",
        message: "An error occurred while deleting the menu item.",
      });
  }
};
