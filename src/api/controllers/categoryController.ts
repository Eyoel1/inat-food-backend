import { Request, Response, NextFunction } from "express";
import Category from "../models/categoryModel";

/**
 * @desc    Create a new category
 * @route   POST /api/v1/categories
 * @access  Private (Owner only)
 */
export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const newCategory = await Category.create(req.body);
    res.status(201).json({
      status: "success",
      data: {
        category: newCategory,
      },
    });
  } catch (err) {
    // This will catch validation errors from the model
    res.status(400).json({ status: "error", message: (err as Error).message });
  }
};

/**
 * @desc    Get all categories
 * @route   GET /api/v1/categories
 * @access  Private (All authenticated staff)
 */
export const getAllCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categories = await Category.find();
    res.status(200).json({
      status: "success",
      results: categories.length,
      data: {
        categories,
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({
        status: "error",
        message: "An error occurred while fetching categories.",
      });
  }
};

/**
 * @desc    Update a specific category
 * @route   PATCH /api/v1/categories/:id
 * @access  Private (Owner only)
 */
export const updateCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // This option returns the modified document
      runValidators: true, // This ensures model validations are run on update
    });

    if (!category) {
      return res
        .status(404)
        .json({ status: "fail", message: "No category found with that ID" });
    }

    res.status(200).json({
      status: "success",
      data: {
        category,
      },
    });
  } catch (err) {
    res.status(400).json({ status: "error", message: (err as Error).message });
  }
};

/**
 * @desc    Delete a specific category
 * @route   DELETE /api/v1/categories/:id
 * @access  Private (Owner only)
 */
export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res
        .status(404)
        .json({ status: "fail", message: "No category found with that ID" });
    }

    // A 204 response means "No Content", which is standard for a successful delete
    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (err) {
    res
      .status(500)
      .json({
        status: "error",
        message: "An error occurred while deleting the category.",
      });
  }
};
