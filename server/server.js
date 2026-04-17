const express = require("express");
const dotenv = require("dotenv"); //to read .env file
const cors = require("cors"); // to connect frontend to backend
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const medicineRoutes = require("./routes/medicineRoutes");
const orderRoutes = require("./routes/orderRoutes");
const reportRoutes = require("./routes/reportRoutes");
const path = require("path");
dotenv.config();
connectDB();

const app = express();

app.use(cors()); //Allows frontend to connect.
app.use(express.json()); // To read JSON data from req

app.use("/api/users", userRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reports", reportRoutes);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.get("/", (req, res) => {
  res.send("HomeoCare API running...");
});

app.get("/home", (req, res) => {
  res.send("This is home page");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
