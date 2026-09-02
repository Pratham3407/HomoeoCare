const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Patient information is required."],
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    date: {
      type: String,
      required: [true, "Please select a date."],
    },

    time: {
      type: String,
      required: [true, "Please select a time."],
    },

    type: {
      type: String,
      enum: {
        values: ["offline", "online"],
        message: "Please select a valid appointment type.",
      },
      default: "offline",
    },

    consultationType: {
      type: String,
      enum: {
        values: ["General Consultation", "Chronic Disease", "Follow-up"],
        message: "Please select a valid consultation type.",
      },
      default: "General Consultation",
    },

    status: {
      type: String,
      enum: {
        values: ["pending", "approved", "cancelled", "postponed", "completed"],
        message: "Please select a valid status.",
      },
      default: "pending",
    },

    reason: {
      type: String,
      default: "",
    },

    prescription: {
      type: String,
      default: "",
    },

    meetLink: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Appointment", appointmentSchema);
