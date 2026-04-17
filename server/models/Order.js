const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
        },
        price: Number,
      },
    ],

    totalAmount: {
      type: Number,
      required: true,
    },

    shippingAddress: {
      street: String,
      city: String,
      state: String,
      pincode: String,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "confirmed_by_doctor"],
      default: "pending",
    },

    orderStatus: {
      type: String,
      enum: ["placed", "reviewed", "shipped", "delivered", "cancelled"],
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
