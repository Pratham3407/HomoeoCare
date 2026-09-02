const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");
const { sendMeetLink } = require("../utils/emailService");
const { protect, doctorOnly, patientOnly } = require("../middleware/auth");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;

// GET all appointments (doctor dashboard) — doctor only
router.get("/", protect, doctorOnly, async (req, res, next) => {
  try {
    const appointments = await Appointment.find().populate("patientId", "name email profilePhoto");
    res.json(appointments);
  } catch (error) {
    next(error);
  }
});

// GET booked times for a specific date — PUBLIC (needed for time slot display)
router.get("/booked/:date", async (req, res, next) => {
  try {
    const { date } = req.params;
    const appointments = await Appointment.find({ date, status: { $nin: ["cancelled", "postponed"] } });

    let bookedTimes = [];
    appointments.forEach((a) => {
      bookedTimes.push(a.time);
      if (a.consultationType === "Chronic Disease") {
        const [hours, minutes] = a.time.split(":").map(Number);
        let dateObj = new Date(2000, 0, 1, hours, minutes);
        dateObj.setMinutes(dateObj.getMinutes() + 30);
        const nextSlot = dateObj.toTimeString().slice(0, 5);
        bookedTimes.push(nextSlot);
      }
    });

    res.json(bookedTimes);
  } catch (error) {
    next(error);
  }
});

// GET appointments for a specific patient — protected (own patient only)
router.get("/my-appointments/:patientId", protect, async (req, res, next) => {
  try {
    // Patient can only see their own; doctor can see any
    if (req.user.role === "patient" && req.user.id !== req.params.patientId) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to view these appointments.",
        fieldErrors: {},
      });
    }
    const appointments = await Appointment.find({ patientId: req.params.patientId }).sort({ createdAt: -1 });
    res.json(appointments);
  } catch (error) {
    next(error);
  }
});

// POST — book a new appointment — patient only
router.post("/", protect, patientOnly, async (req, res, next) => {
  const { patientId, date, time, type, consultationType, reason } = req.body;

  const fieldErrors = {};

  // Ensure patient can only book for themselves
  if (req.user.id !== patientId) {
    return res.status(403).json({
      success: false,
      message: "You don't have permission to book this appointment.",
      fieldErrors: {},
    });
  }

  // Date validation
  if (!date) {
    fieldErrors.date = "Please select a date.";
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    fieldErrors.date = "Please select a valid date.";
  }

  // Time validation
  if (!time) {
    fieldErrors.time = "Please select a time.";
  }

  // Consultation type validation
  if (!consultationType) {
    fieldErrors.consultationType = "Please select a consultation type.";
  } else if (!["General Consultation", "Chronic Disease", "Follow-up"].includes(consultationType)) {
    fieldErrors.consultationType = "Please select a valid consultation type.";
  }

  // Reason validation (optional but if provided must not be absurdly long)
  if (reason && reason.length > 1000) {
    fieldErrors.reason = "Please keep your message under 1000 characters.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return res.status(400).json({
      success: false,
      message: fieldErrors[Object.keys(fieldErrors)[0]],
      fieldErrors,
    });
  }

  try {
    const appointment = new Appointment({
      patientId,
      date,
      time,
      type: type || "offline",
      consultationType: consultationType || "General Consultation",
      reason: reason || "",
    });

    await appointment.save();
    res.status(201).json({
      success: true,
      message: "Appointment requested successfully.",
      fieldErrors: {},
    });
  } catch (error) {
    next(error);
  }
});

// PUT — update appointment status — doctor only
router.put("/:id", protect, doctorOnly, async (req, res, next) => {
  const { status, date, time, reason, meetLink, prescription } = req.body;

  try {
    if (req.params.id && !require("mongoose").Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "The appointment you're looking for could not be found.",
        fieldErrors: {},
      });
    }

    const updateData = {};

    if (status) {
      if (!["pending", "approved", "cancelled", "postponed", "completed"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Please select a valid status.",
          fieldErrors: {},
        });
      }
      updateData.status = status;
    }
    if (date) updateData.date = date;
    if (time) updateData.time = time;
    if (reason !== undefined) updateData.reason = reason;
    if (meetLink !== undefined) updateData.meetLink = meetLink;
    if (prescription !== undefined) updateData.prescription = prescription;

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true },
    ).populate("patientId", "name email profilePhoto");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "We couldn't find this appointment.",
        fieldErrors: {},
      });
    }

    res.json(appointment);
  } catch (error) {
    next(error);
  }
});

// POST — send Google Meet link — doctor only
router.post("/:id/send-meet-link", protect, doctorOnly, async (req, res, next) => {
  const { meetLink } = req.body;

  if (!meetLink) {
    return res.status(400).json({
      success: false,
      message: "Please enter the meeting link.",
      fieldErrors: { meetLink: "Please enter the meeting link." },
    });
  }

  if (!URL_REGEX.test(meetLink)) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid meeting link.",
      fieldErrors: { meetLink: "Please enter a valid meeting link." },
    });
  }

  try {
    const appointment = await Appointment.findById(req.params.id).populate("patientId", "name email profilePhoto");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "We couldn't find this appointment.",
        fieldErrors: {},
      });
    }

    if (!appointment.patientId?.email) {
      return res.status(400).json({
        success: false,
        message: "We couldn't find the patient's email address.",
        fieldErrors: {},
      });
    }

    appointment.meetLink = meetLink;
    await appointment.save();

    await sendMeetLink(
      appointment.patientId.email,
      appointment.patientId.name,
      meetLink,
      appointment.date,
      appointment.time,
    );

    res.json({
      success: true,
      message: "Meeting link sent to the patient's email.",
      fieldErrors: {},
    });
  } catch (error) {
    console.error("Email error:", error);
    res.status(500).json({
      success: false,
      message: "We couldn't send the meeting link right now. Please try again shortly.",
      fieldErrors: {},
    });
  }
});

module.exports = router;