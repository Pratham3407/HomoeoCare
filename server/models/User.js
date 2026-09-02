const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name."],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long."],
      maxlength: [100, "Name must be no more than 100 characters."],
    },
    email: {
      type: String,
      required: [true, "Please enter your email address."],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address."],
    },
    password: {
      type: String,
      required: [true, "Please enter a password."],
      minlength: [6, "Password must be at least 6 characters long."],
    },
    role: {
      type: String,
      enum: {
        values: ["patient", "doctor"],
        message: "Please select a valid account type.",
      },
      default: "patient",
    },
    profilePhoto: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
