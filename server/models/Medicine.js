const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter the medicine name."],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      required: [true, "Please enter a price."],
      min: [0, "Price must be a positive number."],
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, "Stock must be a positive number."],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Medicine", medicineSchema);
