import express from "express";
import cors from "cors";
import userRouter from "./api/routes/userRoutes";
import categoryRouter from "./api/routes/categoryRoutes";
import addOnRouter from "./api/routes/addOnRoutes";
import menuRouter from "./api/routes/menuRoutes";
import orderRouter from "./api/routes/orderRoutes";
import analyticsRouter from "./api/routes/analyticsRoutes";
import systemRouter from "./api/routes/systemRoutes";

export const app = express();

app.use(cors());
app.use(express.json({ limit: "10kb" }));

// --- API Routes ---
app.use("/api/v1/users", userRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/addons", addOnRouter);
app.use("/api/v1/menu", menuRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/analytics", analyticsRouter);
app.use("/api/v1/system", systemRouter);

// --- Health Check for Render ---
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// --- 404 Handler ---
app.all("*", (req, res) => {
  res.status(404).json({
    status: "fail",
    message: `Can't find ${req.originalUrl} on this server!`,
  });
});
