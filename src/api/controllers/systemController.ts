import { Request, Response, NextFunction } from "express";
import Order from "../models/orderModel";

export const resetKds = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Delete all orders that are currently considered 'active' on a KDS.
    const result = await Order.deleteMany({
      overallStatus: { $in: ["Pending", "In Progress"] },
    });

    // --- REAL-TIME EVENT ---
    // Broadcast a reset event to all connected Kitchen and JuiceBar clients.
    const io = req.app.get("socketio");
    io.to("Kitchen").to("JuiceBar").emit("kds_reset");

    res.status(200).json({
      status: "success",
      message: `Successfully deleted ${result.deletedCount} active orders.`,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: (err as Error).message });
  }
};
