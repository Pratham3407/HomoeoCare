const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { protect, doctorOnly } = require("../middleware/auth");
const { sendPasswordResetEmail } = require("../utils/emailService");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Helper: generate token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

// Helper: sanitized user response (never includes password)
const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  profilePhoto: user.profilePhoto,
});

// Register API
router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, role, profilePhoto } = req.body;

    const fieldErrors = {};

    // Name validation
    if (!name || typeof name !== "string" || !name.trim()) {
      fieldErrors.name = "Please enter your name.";
    } else if (name.trim().length < 2) {
      fieldErrors.name = "Name must be at least 2 characters long.";
    }

    // Email validation
    if (!email || typeof email !== "string" || !email.trim()) {
      fieldErrors.email = "Please enter your email address.";
    } else if (!EMAIL_REGEX.test(email.trim())) {
      fieldErrors.email = "Please enter a valid email address.";
    }

    // Password validation
    if (!password || typeof password !== "string") {
      fieldErrors.password = "Please enter a password.";
    } else if (password.length < 6) {
      fieldErrors.password = "Password must be at least 6 characters long.";
    }

    // Role validation
    if (role && !["patient", "doctor"].includes(role)) {
      fieldErrors.role = "Please select a valid account type.";
    }

    // If validation failed, return field-level errors (do NOT reveal duplicate check)
    if (Object.keys(fieldErrors).length > 0) {
      return res.status(400).json({
        success: false,
        message: fieldErrors[Object.keys(fieldErrors)[0]],
        fieldErrors,
      });
    }

    const userExists = await User.findOne({ email: email.trim().toLowerCase() });
    if (userExists) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists. Please sign in instead.",
        fieldErrors: { email: "An account with this email already exists. Please sign in instead." },
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: role || "patient",
      profilePhoto: profilePhoto || "",
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
});

// Login API
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const fieldErrors = {};

    if (!email || typeof email !== "string" || !email.trim()) {
      fieldErrors.email = "Please enter your email address.";
    } else if (!EMAIL_REGEX.test(email.trim())) {
      fieldErrors.email = "Please enter a valid email address.";
    }

    if (!password || typeof password !== "string") {
      fieldErrors.password = "Please enter your password.";
    }

    if (Object.keys(fieldErrors).length > 0) {
      return res.status(400).json({
        success: false,
        message: fieldErrors[Object.keys(fieldErrors)[0]],
        fieldErrors,
      });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    // Use a generic message whether user doesn't exist or password is wrong
    // to avoid revealing whether an account exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Incorrect email or password.",
        fieldErrors: {},
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Incorrect email or password.",
        fieldErrors: {},
      });
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
});

// Forgot Password API
router.post("/forgot-password", async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter your email address.",
        fieldErrors: { email: "Please enter your email address." },
      });
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
        fieldErrors: { email: "Please enter a valid email address." },
      });
    }

    // For security, return the same message whether or not the user exists
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If an account exists, a temporary password has been sent to your email.",
        fieldErrors: {},
      });
    }

    // Generate random password
    const temporaryPassword = crypto.randomBytes(4).toString("hex");

    // Hash the new temporary password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(temporaryPassword, salt);

    // Save new password
    await user.save();

    // Send email to user
    await sendPasswordResetEmail(user.email, user.name, temporaryPassword);

    res.status(200).json({
      success: true,
      message: "If an account exists, a temporary password has been sent to your email.",
      fieldErrors: {},
    });
  } catch (error) {
    next(error);
  }
});

// Update Profile API — protected
router.put("/update/:id", protect, async (req, res, next) => {
  try {
    const { name, email, currentPassword, newPassword, profilePhoto } = req.body;

    // Ensure users can only update their own profile
    if (req.user.id !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update this profile.",
        fieldErrors: {},
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "We couldn't find this account.",
        fieldErrors: {},
      });
    }

    const fieldErrors = {};

    // Name validation (if provided)
    if (name !== undefined) {
      if (!name || !name.trim()) {
        fieldErrors.name = "Please enter your name.";
      } else if (name.trim().length < 2) {
        fieldErrors.name = "Name must be at least 2 characters long.";
      }
    }

    // Email validation (if provided)
    if (email !== undefined) {
      if (!email || !email.trim()) {
        fieldErrors.email = "Please enter your email address.";
      } else if (!EMAIL_REGEX.test(email.trim())) {
        fieldErrors.email = "Please enter a valid email address.";
      }
    }

    // New password validation (if provided)
    if (newPassword) {
      if (!currentPassword) {
        fieldErrors.currentPassword = "Please enter your current password.";
      }
      if (newPassword.length < 6) {
        fieldErrors.newPassword = "Password must be at least 6 characters long.";
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      return res.status(400).json({
        success: false,
        message: fieldErrors[Object.keys(fieldErrors)[0]],
        fieldErrors,
      });
    }

    if (newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Your current password is incorrect.",
          fieldErrors: { currentPassword: "Your current password is incorrect." },
        });
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    if (name) user.name = name.trim();
    if (email) user.email = email.trim().toLowerCase();
    if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully.",
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
});

// Get all Patients API - Doctor only
router.get("/patients", protect, doctorOnly, async (req, res, next) => {
  try {
    const patients = await User.find({ role: "patient" }).select("-password").select("name email profilePhoto");
    res.json(patients);
  } catch (error) {
    next(error);
  }
});

module.exports = router;