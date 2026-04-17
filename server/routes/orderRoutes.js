const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const { protect, doctorOnly, patientOnly } = require("../middleware/auth");

// POST — patient places an order — patient only
router.post("/", protect, patientOnly, async (req, res) => {
  const { patientId, items, totalAmount, shippingAddress } = req.body;

  // Ensure patient can only place orders for themselves
  if (req.user.id !== patientId) {
    return res.status(403).json({ message: "Not authorized" });
  }

  try {
    const order = new Order({
      patientId,
      items,
      totalAmount,
      shippingAddress,
    });

    await order.save();
    res.status(201).json({ message: "Order placed successfully", order });
  } catch (error) {
    res.status(500).json({ message: "Error placing order" });
  }
});

// GET — patient views their own orders — protected
router.get("/my-orders/:patientId", protect, async (req, res) => {
  try {
    // Patient can only view their own orders
    if (req.user.role === "patient" && req.user.id !== req.params.patientId) {
      return res.status(403).json({ message: "Not authorized" });
    }
    const orders = await Order.find({ patientId: req.params.patientId })
      .populate("items.medicineId", "name")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders" });
  }
});

// GET — doctor views all orders — doctor only
router.get("/", protect, doctorOnly, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("patientId", "name email profilePhoto")
      .populate("items.medicineId", "name")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders" });
  }
});

// PUT — doctor updates order — doctor only
router.put("/:id", protect, doctorOnly, async (req, res) => {
  const { paymentStatus, orderStatus, trackingId } = req.body;

  try {
    const updateData = {};
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (orderStatus) updateData.orderStatus = orderStatus;
    if (trackingId !== undefined) updateData.trackingId = trackingId;

    const order = await Order.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    })
      .populate("patientId", "name email profilePhoto")
      .populate("items.medicineId", "name");

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Error updating order" });
  }
});

module.exports = router;
