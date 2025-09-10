import mongoose from "mongoose";
import * as dotenv from "dotenv";
import * as http from "http";
import path from "path";
import { Server as SocketServer } from "socket.io";

dotenv.config({ path: path.join(__dirname, "..", ".env") });
// (Sanity Check logs can be removed if you've confirmed your .env works)

import { app } from "./app";
import { updateOrderStatusForSocket } from "./api/controllers/orderController";

process.on("uncaughtException", (err: Error) => {
  /* ... */
});

const server = http.createServer(app);

const io = new SocketServer(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});
app.set("socketio", io);
io.on("connection", (socket) => {
  /* ... */
});

// --- FIX #1: MONGOOSE CONNECTION ---
// Provide an empty options object as the second argument to satisfy the types.
mongoose
  .connect(process.env.DATABASE_URL!, {})
  .then(() => {
    console.log("✅ DB connection successful!");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
// Note: We also simplified the DB_URL logic and added better error handling.

const port = process.env.PORT || 3000;

// --- FIX #2: SERVER LISTEN METHOD ---
// The http.Server.listen method has multiple signatures. The object-based
// signature is the most explicit and avoids the type errors you were seeing.
const runningServer = server.listen(
  {
    host: "0.0.0.0", // Listen on all network interfaces
    port: port,
  },
  () => {
    console.log(`🚀 App running on port ${port}...`);
  }
);
// --- END OF FIX #2 ---

process.on("unhandledRejection", (err: Error) => {
  console.error(
    "UNHANDLED REJECTION! 💥 Shutting down gracefully...",
    err.name,
    err.message
  );
  runningServer.close(() => {
    process.exit(1);
  });
});
