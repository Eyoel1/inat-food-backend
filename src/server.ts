import mongoose from "mongoose";
import * as dotenv from "dotenv";
import * as http from "http";
import path from "path";
import { Server as SocketServer } from "socket.io";
import { app } from "./app";
import { updateOrderStatusForSocket } from "./api/controllers/orderController";

// Load environment variables from .env
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// --- Sanity Check ---
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("Cloudinary Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("Cloudinary API Key:", process.env.CLOUDINARY_API_KEY);
console.log(
  "Cloudinary API Secret is present:",
  !!process.env.CLOUDINARY_API_SECRET
);

// --- Uncaught Exceptions ---
process.on("uncaughtException", (err: Error) => {
  console.error(
    "UNCAUGHT EXCEPTION! 💥 Shutting down...",
    err.name,
    err.message
  );
  process.exit(1);
});

// --- HTTP Server + Socket.IO ---
const server = http.createServer(app);

const io = new SocketServer(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.set("socketio", io);

io.on("connection", (socket) => {
  console.log(`[SERVER] WebSocket client connected: ${socket.id}`);

  socket.on("join", ({ role, userId }) => {
    if (role === "Kitchen" || role === "JuiceBar") socket.join(role);
    if (userId) socket.join(userId);
  });

  socket.on("update_status", async (data) => {
    try {
      await updateOrderStatusForSocket(data, io);
    } catch (error) {
      console.error("[SERVER] ERROR during updateOrderStatusForSocket:", error);
      socket.emit("update_error", {
        message: "Failed to update order status on the server.",
      });
    }
  });

  socket.on("disconnect", () => {
    console.log(`[SERVER] WebSocket client disconnected: ${socket.id}`);
  });
});

// --- Database Connection ---
const DB_URL = process.env.DATABASE_URL?.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD!
);
if (!DB_URL) throw new Error("DATABASE_URL not defined in .env");
mongoose
  .connect(DB_URL)
  .then(() => console.log("✅ DB connection successful!"));

// --- Start Server ---
const port = process.env.PORT || 3000;
const runningServer = server.listen(port, () => {
  console.log(`🚀 App running on port ${port}...`);
});

// --- Unhandled Rejection Handler ---
process.on("unhandledRejection", (err: Error) => {
  console.error(
    "UNHANDLED REJECTION! 💥 Shutting down...",
    err.name,
    err.message
  );
  runningServer.close(() => process.exit(1));
});
