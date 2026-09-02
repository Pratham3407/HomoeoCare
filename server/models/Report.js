const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Patient information is required."],
    },
    name: {
      type: String,
      required: [true, "Please enter a report name."],
      trim: true,
    },
    fileUrl: {
      type: String,
      required: [true, "Please upload a file."],
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "reviewed"],
        message: "Please select a valid status.",
      },
      default: "pending",
    },
    doctorFeedback: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);
