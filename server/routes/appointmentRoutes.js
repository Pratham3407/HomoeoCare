const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");
const { sendMeetLink } = require("../utils/emailService");
const { protect, doctorOnly, patientOnly } = require("../middleware/auth");

// GET all appointments (doctor dashboard) — doctor only
router.get("/", protect, doctorOnly, async (req, res) => {
  try {
    const appointments = await Appointment.find().populate("patientId", "name email profilePhoto");
    res.json(appointments);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching appointments" });
  }
});

// GET booked times for a specific date — PUBLIC (needed for time slot display)
router.get("/booked/:date", async (req, res) => {
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
    res.status(500).json({ message: "Error fetching booked times" });
  }
});

// GET appointments for a specific patient — protected (own patient only)
router.get("/my-appointments/:patientId", protect, async (req, res) => {
  try {
    // Patient can only see their own; doctor can see any
    if (req.user.role === "patient" && req.user.id !== req.params.patientId) {
      return res.status(403).json({ message: "Not authorized" });
    }
    const appointments = await Appointment.find({ patientId: req.params.patientId }).sort({ createdAt: -1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: "Error fetching appointments" });
  }
});

// POST — book a new appointment — patient only
router.post("/", protect, patientOnly, async (req, res) => {
  const { patientId, date, time, type, consultationType, reason } = req.body;

  // Ensure patient can only book for themselves
  if (req.user.id !== patientId) {
    return res.status(403).json({ message: "Not authorized" });
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
    res.json({ message: "Appointment booked" });
  } catch (error) {
    res.status(500).json({ message: "Error booking appointment" });
  }
});

// PUT — update appointment status — doctor only
router.put("/:id", protect, doctorOnly, async (req, res) => {
  const { status, date, time, reason, meetLink, prescription } = req.body;

  try {
    const updateData = {};
    if (status) updateData.status = status;
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

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: "Error updating appointment" });
  }
});

// POST — send Google Meet link — doctor only
router.post("/:id/send-meet-link", protect, doctorOnly, async (req, res) => {
  const { meetLink } = req.body;

  try {
    const appointment = await Appointment.findById(req.params.id).populate("patientId", "name email profilePhoto");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (!appointment.patientId?.email) {
      return res.status(400).json({ message: "Patient email not found" });
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

    res.json({ message: "Meet link sent to patient's email" });
  } catch (error) {
    console.error("Email error:", error);
    res.status(500).json({ message: "Error sending meet link: " + error.message });
  }
});

module.exports = router;
