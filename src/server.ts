import mongoose from "mongoose";
import * as dotenv from "dotenv";
import * as http from "http";
import path from "path";
import { Server as SocketServer } from "socket.io";

// --- This line MUST be at the top ---
dotenv.config({ path: path.join(__dirname, "..", ".env") });

import { app } from "./app";
import { updateOrderStatusForSocket } from "./api/controllers/orderController";

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
io.on("connection", (socket) => {
  // Socket event listeners go here...
});

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  throw new Error("FATAL ERROR: DATABASE_URL is not defined in .env file.");
}

// --- THIS IS THE CORRECTED MONGOOSE CONNECTION ---
mongoose
  .connect(DB_URL, {})
  .then(() => {
    console.log("✅ DB connection successful!");
  })
  .catch((err) => {
    console.error("FATAL ERROR: MongoDB connection failed:", err);
    process.exit(1); // Exit if the database connection fails
  });

const port = process.env.PORT || 3000;

// --- THIS IS THE CORRECTED SERVER LISTEN METHOD ---
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
  runningServer.close(() => {
    process.exit(1);
  });
});
