import mongoose from "mongoose";
import * as dotenv from "dotenv";
import * as http from "http";
import path from "path";
import { Server as SocketServer } from "socket.io";

dotenv.config({ path: path.join(__dirname, "..", ".env") });
// (You can remove the "Sanity Check" console.logs now if you want)

import { app } from "./app";
import { updateOrderStatusForSocket } from "./api/controllers/orderController";

process.on("uncaughtException" /* ... */);
const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});
app.set("socketio", io);
io.on("connection", (socket) => {
  /* ... */
});

const DB_URL = process.env.DATABASE_URL?.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD!
);
if (!DB_URL) throw new Error("FATAL ERROR: DATABASE_URL not defined");
mongoose
  .connect(DB_URL)
  .then(() => console.log("✅ DB connection successful!"));

const port = process.env.PORT || 3000;

// --- THIS IS THE CRITICAL FIX ---
// We add '0.0.0.0' as the second argument. This tells the server to listen on all
// available network interfaces, not just localhost. This allows Render's
// external health checker to successfully connect.
const runningServer = server.listen(port, "0.0.0.0", () => {
  console.log(`🚀 App running on port ${port}...`);
});
// --- END OF FIX ---

process.on("unhandledRejection" /* ... */);
