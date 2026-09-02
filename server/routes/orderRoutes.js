const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const mongoose = require("mongoose");
const { protect, doctorOnly, patientOnly } = require("../middleware/auth");

const PINCODE_REGEX = /^\d{4,10}$/;

// POST — patient places an order — patient only
router.post("/", protect, patientOnly, async (req, res, next) => {
  const { patientId, items, totalAmount, shippingAddress } = req.body;

  const fieldErrors = {};

  if (req.user.id !== patientId) {
    return res.status(403).json({
      success: false,
      message: "You don't have permission to place this order.",
      fieldErrors: {},
    });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    fieldErrors.items = "Please add at least one item to your order.";
  }

  if (totalAmount === "" || totalAmount === null || totalAmount === undefined || isNaN(Number(totalAmount))) {
    fieldErrors.totalAmount = "Order total is required.";
  }

  if (!shippingAddress || typeof shippingAddress !== "object") {
    fieldErrors.shippingAddress = "Please provide your shipping address.";
  } else {
    if (!shippingAddress.street || !shippingAddress.street.trim()) {
      fieldErrors.street = "Please enter your street address.";
    }
    if (!shippingAddress.city || !shippingAddress.city.trim()) {
      fieldErrors.city = "Please enter your city.";
    }
    if (!shippingAddress.state || !shippingAddress.state.trim()) {
      fieldErrors.state = "Please enter your state.";
    }
    if (!shippingAddress.pincode || !shippingAddress.pincode.trim()) {
      fieldErrors.pincode = "Please enter your pincode.";
    } else if (!PINCODE_REGEX.test(shippingAddress.pincode.trim())) {
      fieldErrors.pincode = "Please enter a valid pincode.";
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return res.status(400).json({
      success: false,
      message: fieldErrors[Object.keys(fieldErrors)[0]],
      fieldErrors,
    });
  }

  try {
    const order = new Order({
      patientId,
      items,
      totalAmount: Number(totalAmount),
      shippingAddress: {
        street: shippingAddress.street.trim(),
        city: shippingAddress.city.trim(),
        state: shippingAddress.state.trim(),
        pincode: shippingAddress.pincode.trim(),
      },
    });

    await order.save();
    res.status(201).json({
      success: true,
      message: "Order placed successfully.",
      order,
      fieldErrors: {},
    });
  } catch (error) {
    next(error);
  }
});

// GET — patient views their own orders — protected
router.get("/my-orders/:patientId", protect, async (req, res, next) => {
  try {
    // Patient can only view their own orders
    if (req.user.role === "patient" && req.user.id !== req.params.patientId) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to view these orders.",
        fieldErrors: {},
      });
    }
    const orders = await Order.find({ patientId: req.params.patientId })
      .populate("items.medicineId", "name")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

// GET — doctor views all orders — doctor only
router.get("/", protect, doctorOnly, async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate("patientId", "name email profilePhoto")
      .populate("items.medicineId", "name")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

// PUT — doctor updates order — doctor only
router.put("/:id", protect, doctorOnly, async (req, res, next) => {
  const { paymentStatus, orderStatus, trackingId } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "The order you're looking for could not be found.",
        fieldErrors: {},
      });
    }

    const fieldErrors = {};

    if (paymentStatus && !["pending", "paid", "confirmed_by_doctor"].includes(paymentStatus)) {
      fieldErrors.paymentStatus = "Please select a valid payment status.";
    }

    if (orderStatus && !["placed", "reviewed", "shipped", "delivered", "cancelled"].includes(orderStatus)) {
      fieldErrors.orderStatus = "Please select a valid order status.";
    }

    if (Object.keys(fieldErrors).length > 0) {
      return res.status(400).json({
        success: false,
        message: fieldErrors[Object.keys(fieldErrors)[0]],
        fieldErrors,
      });
    }

    const updateData = {};
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (orderStatus) updateData.orderStatus = orderStatus;
    if (trackingId !== undefined) updateData.trackingId = trackingId;

    const order = await Order.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    })
      .populate("patientId", "name email profilePhoto")
      .populate("items.medicineId", "name");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "We couldn't find this order.",
        fieldErrors: {},
      });
    }

    res.json({
      success: true,
      message: "Order updated successfully.",
      order,
      fieldErrors: {},
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;