const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Report = require("../models/Report");
const User = require("../models/User");
const { sendReportReviewEmail } = require("../utils/emailService");
const { protect, doctorOnly, patientOnly } = require("../middleware/auth");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../uploads/");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB Max
});

// POST /api/reports - Patient uploads a new report
router.post("/", protect, patientOnly, upload.single("file"), async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Report name is required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const report = new Report({
      patientId: req.user.id,
      name: name,
      fileUrl: `/uploads/${req.file.filename}`,
    });

    await report.save();
    res.status(201).json({ message: "Report uploaded successfully", report });
  } catch (error) {
    console.error("Error uploading report:", error);
    res.status(500).json({ message: "Error uploading report", error: error.message });
  }
});

// GET /api/reports/patient/:patientId - Get patient's reports
router.get("/patient/:patientId", protect, async (req, res) => {
  try {
    // Only the owner patient or a doctor can view reports
    if (req.user.role === "patient" && req.user.id !== req.params.patientId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const reports = await Report.find({ patientId: req.params.patientId }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ message: "Error fetching reports" });
  }
});

// PUT /api/reports/:id - Update report name or replace file
router.put("/:id", protect, patientOnly, upload.single("file"), async (req, res) => {
  try {
    const { name } = req.body;
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (report.patientId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (name) report.name = name;

    if (req.file) {
      // Option: Delete old file here if it exists to save space
      const oldPath = path.join(__dirname, "..", report.fileUrl);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
      report.fileUrl = `/uploads/${req.file.filename}`;
      // resetting status/feedback when file is replaced
      report.status = "pending";
      report.doctorFeedback = "";
    }

    await report.save();
    res.json({ message: "Report updated successfully", report });
  } catch (error) {
    console.error("Error updating report:", error);
    res.status(500).json({ message: "Error updating report" });
  }
});

// DELETE /api/reports/:id - Delete a report
router.delete("/:id", protect, patientOnly, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (report.patientId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Delete file
    const filePath = path.join(__dirname, "..", report.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Report.findByIdAndDelete(req.params.id);
    res.json({ message: "Report deleted successfully" });
  } catch (error) {
    console.error("Error deleting report:", error);
    res.status(500).json({ message: "Error deleting report" });
  }
});

// PUT /api/reports/:id/review - Doctor adds feedback
router.put("/:id/review", protect, doctorOnly, async (req, res) => {
  try {
    const { doctorFeedback } = req.body;
    const report = await Report.findById(req.params.id).populate("patientId");

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    report.doctorFeedback = doctorFeedback;
    report.status = "reviewed";

    await report.save();

    // Send email notification to patient
    if (report.patientId && report.patientId.email) {
      try {
        await sendReportReviewEmail(report.patientId.email, report.patientId.name, report.name);
      } catch (emailError) {
        console.error("Failed to send review email:", emailError);
        // Do not fail the request if email fails
      }
    }

    res.json({ message: "Feedback added successfully", report });
  } catch (error) {
    console.error("Error adding feedback:", error);
    res.status(500).json({ message: "Error adding feedback" });
  }
});

module.exports = router;
