const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    date: String,
    time: String,

    type: {
      type: String,
      enum: ["offline", "online"],
      default: "offline",
    },

    consultationType: {
      type: String,
      enum: ["General Consultation", "Chronic Disease", "Follow-up"],
      default: "General Consultation",
    },

    status: {
      type: String,
      enum: ["pending", "approved", "cancelled", "postponed", "completed"],
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
