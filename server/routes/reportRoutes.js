const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Report = require("../models/Report");
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
router.post("/", protect, patientOnly, upload.single("file"), async (req, res, next) => {
  try {
    const { name } = req.body;

    const fieldErrors = {};

    if (!name || !name.trim()) {
      fieldErrors.name = "Please enter a report name.";
    }

    if (!req.file) {
      fieldErrors.file = "Please choose a file to upload.";
    }

    if (Object.keys(fieldErrors).length > 0) {
      return res.status(400).json({
        success: false,
        message: fieldErrors[Object.keys(fieldErrors)[0]],
        fieldErrors,
      });
    }

    const report = new Report({
      patientId: req.user.id,
      name: name.trim(),
      fileUrl: `/uploads/${req.file.filename}`,
    });

    await report.save();
    res.status(201).json({
      success: true,
      message: "Report uploaded successfully.",
      report,
      fieldErrors: {},
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/patient/:patientId - Get patient's reports
router.get("/patient/:patientId", protect, async (req, res, next) => {
  try {
    // Only the owner patient or a doctor can view reports
    if (req.user.role === "patient" && req.user.id !== req.params.patientId) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to view these reports.",
        fieldErrors: {},
      });
    }

    const reports = await Report.find({ patientId: req.params.patientId }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    next(error);
  }
});

// PUT /api/reports/:id - Update report name or replace file
router.put("/:id", protect, patientOnly, upload.single("file"), async (req, res, next) => {
  try {
    const { name } = req.body;
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "We couldn't find this report.",
        fieldErrors: {},
      });
    }

    if (report.patientId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update this report.",
        fieldErrors: {},
      });
    }

    if (name !== undefined && !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter a report name.",
        fieldErrors: { name: "Please enter a report name." },
      });
    }

    if (name) report.name = name.trim();

    if (req.file) {
      // Delete old file here if it exists to save space
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
    res.json({
      success: true,
      message: "Report updated successfully.",
      report,
      fieldErrors: {},
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/reports/:id - Delete a report
router.delete("/:id", protect, patientOnly, async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "We couldn't find this report.",
        fieldErrors: {},
      });
    }

    if (report.patientId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this report.",
        fieldErrors: {},
      });
    }

    // Delete file
    const filePath = path.join(__dirname, "..", report.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Report.findByIdAndDelete(req.params.id);
    res.json({
      success: true,
      message: "Report deleted successfully.",
      fieldErrors: {},
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/reports/:id/review - Doctor adds feedback
router.put("/:id/review", protect, doctorOnly, async (req, res, next) => {
  try {
    const { doctorFeedback } = req.body;

    if (!doctorFeedback || !doctorFeedback.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter your feedback.",
        fieldErrors: { doctorFeedback: "Please enter your feedback." },
      });
    }

    const report = await Report.findById(req.params.id).populate("patientId");

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "We couldn't find this report.",
        fieldErrors: {},
      });
    }

    report.doctorFeedback = doctorFeedback.trim();
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

    res.json({
      success: true,
      message: "Feedback added successfully.",
      report,
      fieldErrors: {},
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;