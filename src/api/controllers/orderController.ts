import { Request, Response } from "express";
import { Server as SocketServer } from "socket.io";
import Order, { OrderStatus, PaymentMethod } from "../models/orderModel";
import { getNextSequence } from "../models/counterModel";
import { PreparationStation } from "../models/categoryModel";

// --- API-Based Controllers ---

export const createOrder = async (req: Request, res: Response) => {
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

export const completeOrder = async (req: Request, res: Response) => {
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

export const getMyOrders = async (req: Request, res: Response) => {
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
  data: any,
  io: SocketServer
) => {
  const { orderId, station, newStatus } = data;

  const currentOrder = await Order.findById(orderId);
  if (!currentOrder) {
    throw new Error(`Order not found for ID: ${orderId}`);
  }

  const { stationStatuses } = currentOrder;
  const stationStatus = stationStatuses.find((ss) => ss.station === station);
  if (stationStatus) {
    stationStatus.status = newStatus as OrderStatus;
  }

  const allReady = stationStatuses.every(
    (ss) => ss.status === OrderStatus.Ready
  );
  let newOverallStatus = allReady
    ? OrderStatus.Ready
    : stationStatuses.some((ss) => ss.status === OrderStatus.InProgress)
    ? OrderStatus.InProgress
    : OrderStatus.Pending;

  const updatedOrder = await Order.findByIdAndUpdate(
    orderId,
    { $set: { stationStatuses, overallStatus: newOverallStatus } },
    { new: true }
  ).populate("waitress", "name");

  if (!updatedOrder) {
    throw new Error(`Update failed for order ID: ${orderId}`);
  }

  io.to(updatedOrder.waitress.toString()).emit("status_update", updatedOrder);
  io.to("Kitchen").to("JuiceBar").emit("status_update", updatedOrder);
};
