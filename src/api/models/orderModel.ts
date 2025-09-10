import mongoose, { Schema, Document } from "mongoose";
import { PreparationStation } from "./categoryModel";

export enum OrderStatus {
  Pending = "Pending",
  InProgress = "In Progress",
  Ready = "Ready",
  Completed = "Completed", // After payment
  Voided = "Voided",
}

export enum PaymentMethod {
  Cash = "Cash",
  Card = "Card",
  Telebirr = "Telebirr",
}

// Defines a single item within an order
interface IOrderedItem {
  menuItem: mongoose.Schema.Types.ObjectId;
  nameSnapshot: string;
  quantity: number;
  variantName?: string;
  unitPrice: number;
  selectedAddOns: {
    addOn: mongoose.Schema.Types.ObjectId;
    nameSnapshot: string;
    price: number;
  }[];
  specialInstructions?: string;
  station: PreparationStation;
}

// Defines the status for one preparation station
interface IStationStatus {
  station: PreparationStation;
  status: OrderStatus;
}

export interface IOrder extends Document {
  orderNumber: number;
  waitress: mongoose.Schema.Types.ObjectId;
  items: IOrderedItem[];
  totalPrice: number;
  orderType: "Serve Here" | "Take Away";
  stationStatuses: IStationStatus[];
  overallStatus: OrderStatus;

  // Payment-related
  paymentMethod?: PaymentMethod;
  isPaid: boolean;

  tableNumber?: string;
}

const orderSchema: Schema = new Schema(
  {
    orderNumber: { type: Number, required: true, unique: true },
    waitress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        menuItem: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MenuItem",
          required: true,
        },
        nameSnapshot: String,
        quantity: { type: Number, required: true },
        variantName: String,
        unitPrice: { type: Number, required: true },
        selectedAddOns: [
          {
            addOn: { type: mongoose.Schema.Types.ObjectId, ref: "AddOn" },
            nameSnapshot: String,
            price: Number,
          },
        ],
        specialInstructions: String,
        station: {
          type: String,
          enum: Object.values(PreparationStation),
          required: true,
        },
      },
    ],
    totalPrice: { type: Number, required: true },
    orderType: {
      type: String,
      enum: ["Serve Here", "Take Away"],
      default: "Serve Here",
    },
    stationStatuses: [
      {
        station: { type: String, enum: Object.values(PreparationStation) },
        status: {
          type: String,
          enum: Object.values(OrderStatus),
          default: OrderStatus.Pending,
        },
      },
    ],
    overallStatus: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.Pending,
    },
    paymentMethod: { type: String, enum: Object.values(PaymentMethod) },
    isPaid: { type: Boolean, default: false },
    tableNumber: String,
  },
  { timestamps: true }
);

export default mongoose.model<IOrder>("Order", orderSchema);
