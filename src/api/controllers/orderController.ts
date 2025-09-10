import { Request, Response } from "express";
import { Server as SocketServer } from "socket.io";
import Order, { OrderStatus, PaymentMethod } from "../models/orderModel";
import { getNextSequence } from "../models/counterModel";
import { PreparationStation } from "../models/categoryModel";

// --- TYPE DEFINITIONS ---
interface AuthenticatedRequest extends Request {
  user?: { _id: string; name?: string };
}

interface UpdateOrderStatusPayload {
  orderId: string;
  station: PreparationStation;
  newStatus: OrderStatus;
}

// --- API-Based Controllers ---

export const createOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { items, orderType, tableNumber, totalPrice } = req.body;
    const waitressId = req.user!._id;

    const stationsInvolved = [
      ...new Set(items.map((item: any) => item.station)),
    ] as PreparationStation[];

    const stationStatuses = stationsInvolved.map((station) => ({
      station,
      status: OrderStatus.Pending,
    }));

    const orderNumber = await getNextSequence("orderNumber");

    const newOrder = await Order.create({
      orderNumber,
      waitress: waitressId,
      items,
      orderType,
      tableNumber,
      totalPrice,
      stationStatuses,
      overallStatus: OrderStatus.Pending,
    });

    const populatedOrder = await newOrder.populate("waitress", "name");
    const io = req.app.get("socketio") as SocketServer;

    stationsInvolved.forEach((station) => {
      io.to(station).emit("new_order", populatedOrder);
    });

    res
      .status(201)
      .json({ status: "success", data: { order: populatedOrder } });
  } catch (err: any) {
    res.status(400).json({ status: "error", message: err.message });
  }
};

export const completeOrder = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { orderId, paymentMethod } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.overallStatus = OrderStatus.Completed;
    order.paymentMethod = paymentMethod as PaymentMethod;
    order.isPaid = true;

    await order.save();

    const io = req.app.get("socketio") as SocketServer;
    io.to(order.waitress.toString()).emit("status_update", order);

    res.status(200).json({ status: "success", data: { order } });
  } catch (err: any) {
    res.status(400).json({ status: "error", message: err.message });
  }
};

export const getKdsOrders = async (req: Request, res: Response) => {
  try {
    const station = req.params.station as PreparationStation;

    const orders = await Order.find({
      "stationStatuses.station": station,
      "stationStatuses.status": {
        $in: [OrderStatus.Pending, OrderStatus.InProgress],
      },
    })
      .populate("waitress", "name")
      .sort("createdAt");

    res.status(200).json({ status: "success", data: { orders } });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

export const getMyOrders = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const waitressId = req.user!._id;

    const orders = await Order.find({
      waitress: waitressId,
      overallStatus: {
        $in: [OrderStatus.Pending, OrderStatus.InProgress, OrderStatus.Ready],
      },
    }).sort("-createdAt");

    res.status(200).json({ status: "success", data: { orders } });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// --- SOCKET-Based Controller ---

export const updateOrderStatusForSocket = async (
  data: UpdateOrderStatusPayload,
  io: SocketServer
) => {
  const { orderId, station, newStatus } = data;

  // Step 1: Atomically update the specific station's status
  const updatedOrder = await Order.findOneAndUpdate(
    { _id: orderId, "stationStatuses.station": station },
    {
      $set: {
        "stationStatuses.$.status": newStatus,
      },
    },
    { new: true }
  ).populate("waitress", "name");

  if (!updatedOrder) {
    throw new Error(`Order not found for ID: ${orderId}`);
  }

  // Step 2: Recalculate overallStatus
  const allReady = updatedOrder.stationStatuses.every(
    (ss) => ss.status === OrderStatus.Ready
  );

  const anyInProgress = updatedOrder.stationStatuses.some(
    (ss) => ss.status === OrderStatus.InProgress
  );

  updatedOrder.overallStatus = allReady
    ? OrderStatus.Ready
    : anyInProgress
    ? OrderStatus.InProgress
    : OrderStatus.Pending;

  await updatedOrder.save(); // Save the new overallStatus

  console.log(
    `[SERVER] Broadcasting 'status_update' for order #${updatedOrder.orderNumber}`
  );

  // Step 3: Broadcast updates to relevant clients
  io.to(updatedOrder.waitress.toString()).emit("status_update", updatedOrder);

  updatedOrder.stationStatuses.forEach((ss) => {
    io.to(ss.station).emit("status_update", updatedOrder);
  });
};
