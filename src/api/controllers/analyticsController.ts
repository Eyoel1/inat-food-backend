import { Request, Response, NextFunction } from "express";
import Order from "../models/orderModel";
import mongoose from "mongoose";

export const getSalesAnalyticsByWaitress = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const period = req.query.period || "today";
    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    if (period === "week") startDate.setDate(startDate.getDate() - 7);
    else if (period === "month") startDate.setMonth(startDate.getMonth() - 1);

    const salesPipeline: mongoose.PipelineStage[] = [
      {
        $match: { createdAt: { $gte: startDate }, overallStatus: "Completed" },
      },
      {
        $group: {
          _id: "$waitress",
          totalSales: { $sum: "$totalPrice" },
          soldItems: { $push: "$items" },
        },
      },
      { $unwind: "$soldItems" },
      { $unwind: "$soldItems" },
      {
        $group: {
          _id: { waitressId: "$_id", itemName: "$soldItems.nameSnapshot" },
          totalQuantity: { $sum: "$soldItems.quantity" },
          waitressTotalSales: { $first: "$totalSales" },
        },
      },
      {
        $group: {
          _id: "$_id.waitressId",
          totalSales: { $first: "$waitressTotalSales" },
          itemizedSales: {
            $push: { name: "$_id.itemName", quantity: "$totalQuantity" },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "waitressInfo",
        },
      },
      { $unwind: "$waitressInfo" },
      {
        $project: {
          _id: 0,
          waitress: { id: "$waitressInfo._id", name: "$waitressInfo.name" },
          totalSales: 1,
          itemizedSales: 1,
        },
      },
      { $sort: { totalSales: -1 } },
    ];

    const analyticsResult = await Order.aggregate(salesPipeline);
    res.status(200).json({ status: "success", data: analyticsResult });
  } catch (err) {
    res.status(500).json({ status: "error", message: (err as Error).message });
  }
};

export const resetSalesAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await Order.deleteMany({ overallStatus: "Completed" });
    res.status(200).json({
      status: "success",
      message: `Successfully reset sales data. Deleted ${result.deletedCount} completed orders.`,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: (err as Error).message });
  }
};
