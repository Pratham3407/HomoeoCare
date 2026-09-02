const express = require("express");
const dotenv = require("dotenv"); //to read .env file
const cors = require("cors"); // to connect frontend to backend
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const medicineRoutes = require("./routes/medicineRoutes");
const orderRoutes = require("./routes/orderRoutes");
const reportRoutes = require("./routes/reportRoutes");
const { errorHandler } = require("./middleware/errorHandler");
const path = require("path");
dotenv.config();
connectDB();

const app = express();

app.use(cors()); //Allows frontend to connect.
app.use(express.json()); // To read JSON data from req

// Log requests server-side only (dev detail, never exposed to clients)
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

app.use("/api/users", userRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reports", reportRoutes);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API 404 handler - for any unmatched /api routes
app.use((req, res, next) => {
  if (req.originalUrl.startsWith("/api")) {
    return res.status(404).json({
      success: false,
      message: "We couldn't find what you're looking for.",
      fieldErrors: {},
    });
  }
  next();
});

// Serve React frontend build (for production deployment)
const clientBuildPath = path.join(__dirname, "../client/dist");
app.use(express.static(clientBuildPath));

// Handle React Router - send all non-API requests to index.html
app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(clientBuildPath, "index.html"));
});

// Global error handler - MUST be last
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});