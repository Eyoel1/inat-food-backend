import { Request, Response, NextFunction } from "express";
import User, { IUser } from "../models/userModel";

/**
 * @desc    Get the profile of the currently logged-in user
 * @route   GET /api/v1/users/me
 * @access  Private (Any logged-in user)
 */
export const getMe = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ status: "fail", message: "Not authorized" });
  }

  res.status(200).json({
    status: "success",
    data: { user: req.user },
  });
};

/**
 * @desc    Get all users (for staff management)
 * @route   GET /api/v1/users
 * @access  Private (Owner only)
 */
export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await User.find();
    res.status(200).json({
      status: "success",
      results: users.length,
      data: { users },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "An error occurred while fetching users.",
    });
  }
};

/**
 * @desc    Create a new user (for staff management)
 * @route   POST /api/v1/users
 * @access  Private (Owner only)
 */
export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.body.role === "Owner") {
      return res.status(400).json({
        status: "fail",
        message: "Cannot assign Owner role via API.",
      });
    }

    const newUser = await User.create({
      name: req.body.name,
      username: req.body.username,
      pin: req.body.pin,
      role: req.body.role,
    });

    // Prevent PIN from being sent back
    (newUser as any).pin = undefined;

    res.status(201).json({
      status: "success",
      data: { user: newUser },
    });
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(400).json({
        status: "error",
        message: "Username is already taken. Please choose another.",
      });
    }
    res.status(400).json({ status: "error", message: err.message });
  }
};

/**
 * @desc    Update a user (staff member)
 * @route   PATCH /api/v1/users/:id
 * @access  Private (Owner only)
 */
export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Prevent privilege escalation or PIN overwrite here
    if (req.body.role === "Owner") delete req.body.role;
    if (req.body.pin) delete req.body.pin;

    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return res
        .status(404)
        .json({ status: "fail", message: "No user found with that ID" });
    }

    res.status(200).json({
      status: "success",
      data: { user: updatedUser },
    });
  } catch (err: any) {
    res.status(400).json({ status: "error", message: err.message });
  }
};

/**
 * @desc    Delete a user (staff member)
 * @route   DELETE /api/v1/users/:id
 * @access  Private (Owner only)
 */
export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ status: "fail", message: "No user found with that ID" });
    }
    res.status(204).json({ status: "success", data: null });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
