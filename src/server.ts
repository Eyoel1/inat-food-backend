import mongoose from "mongoose";
import * as dotenv from "dotenv";
import * as http from "http";
import path from "path";
import { Server as SocketServer } from "socket.io";
import { app } from "./app";
import { updateOrderStatusForSocket } from "./api/controllers/orderController";

dotenv.config({ path: path.join(__dirname, "..", ".env") });

process.on("uncaughtException", (err: Error) => {
  console.error(
    "UNCAUGHT EXCEPTION! 💥 Shutting down...",
    err.name,
    err.message
  );
  process.exit(1);
});

const server = http.createServer(app);

const io = new SocketServer(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.set("socketio", io);

// --- Real-Time Communication Logic ---
io.on("connection", (socket) => {
  console.log(`[SERVER] Client connected: ${socket.id}`);

  socket.on("join", ({ role, userId }) => {
    if (role) {
      socket.join(role);
      console.log(`[SERVER] Socket ${socket.id} joined room: "${role}"`);
    }
    if (userId) {
      socket.join(userId);
      console.log(`[SERVER] Socket ${socket.id} joined room: "${userId}"`);
    }
    // --- DIAGNOSTIC LOG: See the current state of rooms after a client joins ---
    const rooms = Array.from(io.sockets.adapter.rooms.keys());
    console.log(`[SERVER] Current active rooms: [${rooms.join(", ")}]`);
  });

  socket.on("update_status", async (data) => {
    console.log(
      `[SERVER] Received 'update_status' from client ${socket.id} with data:`,
      data
    );
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
    console.log(`[SERVER] Client disconnected: ${socket.id}`);
  });
});

const DB_URL = process.env.DATABASE_URL!;
if (!DB_URL) throw new Error("FATAL ERROR: DATABASE_URL not defined");

mongoose
  .connect(DB_URL, {})
  .then(() => {
    console.log("✅ DB connection successful!");
  })
  .catch((err) => {
    console.error("FATAL ERROR: MongoDB connection failed:", err);
    process.exit(1);
  });

const port = process.env.PORT || 3000;

const runningServer = server.listen(
  {
    host: "0.0.0.0", // Listen on all network interfaces
    port: port,
  },
  () => {
    console.log(`🚀 App running on port ${port}...`);
  }
);

process.on("unhandledRejection", (err: Error) => {
  console.error(
    "UNHANDLED REJECTION! 💥 Shutting down gracefully...",
    err.name,
    err.message
  );
  runningServer.close(() => process.exit(1));
});
