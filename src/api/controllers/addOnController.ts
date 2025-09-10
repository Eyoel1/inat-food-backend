import { Request, Response, NextFunction } from "express";
import AddOn from "../models/addOnModel";
/**
@desc Create a new add-on
@route POST /api/v1/addons
@access Private (Owner only)
*/
export const createAddOn = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const newAddOn = await AddOn.create(req.body);
    res.status(201).json({
      status: "success",
      data: {
        addOn: newAddOn,
      },
    });
  } catch (err) {
    res.status(400).json({ status: "error", message: (err as Error).message });
  }
};
/**
@desc Get all add-ons
@route GET /api/v1/addons
@access Private (All authenticated staff)
*/
export const getAllAddOns = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const addOns = await AddOn.find();
    res.status(200).json({
      status: "success",
      results: addOns.length,
      data: {
        addOns,
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({
        status: "error",
        message: "An error occurred while fetching add-ons.",
      });
  }
};
/**
@desc Update a specific add-on
@route PATCH /api/v1/addons/:id
@access Private (Owner only)
*/
export const updateAddOn = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const addOn = await AddOn.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!addOn) {
      return res
        .status(404)
        .json({ status: "fail", message: "No add-on found with that ID" });
    }

    res.status(200).json({
      status: "success",
      data: {
        addOn,
      },
    });
  } catch (err) {
    res.status(400).json({ status: "error", message: (err as Error).message });
  }
};
/**
@desc Delete a specific add-on
@route DELETE /api/v1/addons/:id
@access Private (Owner only)
*/
export const deleteAddOn = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const addOn = await AddOn.findByIdAndDelete(req.params.id);
    if (!addOn) {
      return res
        .status(404)
        .json({ status: "fail", message: "No add-on found with that ID" });
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (err) {
    res
      .status(500)
      .json({
        status: "error",
        message: "An error occurred while deleting the add-on.",
      });
  }
};
