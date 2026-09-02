const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Patient information is required."],
    },

    items: [
      {
        medicineId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Medicine",
        },
        name: String,
        quantity: {
          type: Number,
          default: 1,
          min: [1, "Quantity must be at least 1."],
        },
        price: Number,
      },
    ],

    totalAmount: {
      type: Number,
      required: [true, "Order total is required."],
      min: [0, "Total must be a positive number."],
    },

    shippingAddress: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      pincode: { type: String, default: "" },
    },

    paymentStatus: {
      type: String,
      enum: {
        values: ["pending", "paid", "confirmed_by_doctor"],
        message: "Please select a valid payment status.",
      },
      default: "pending",
    },

    orderStatus: {
      type: String,
      enum: {
        values: ["placed", "reviewed", "shipped", "delivered", "cancelled"],
        message: "Please select a valid order status.",
      },
      default: "placed",
    },

    trackingId: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Order", orderSchema);
