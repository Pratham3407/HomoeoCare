const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { protect, doctorOnly } = require("../middleware/auth");
const { sendPasswordResetEmail } = require("../utils/emailService");

// Helper: generate token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

// Register API
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, profilePhoto } = req.body;

    // Strict Input Validation (Prevent NoSQL Injection & Bad Input)
    if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: "Invalid input format. Must be text." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists. Please Login" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      profilePhoto: profilePhoto || "",
    });

    const token = generateToken(user);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePhoto: user.profilePhoto,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login API
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user);

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePhoto: user.profilePhoto,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Forgot Password API
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found with this email" });
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

    res.status(200).json({ message: "A temporary password has been sent to your email" });
  } catch (error) {
    res.status(500).json({ message: "Error sending reset email: " + error.message });
  }
});

// Update Profile API — protected
router.put("/update/:id", protect, async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword, profilePhoto } = req.body;

    // Ensure users can only update their own profile
    if (req.user.id !== req.params.id) {
      return res.status(403).json({ message: "Not authorized to update this profile" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: "Current password is required" });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePhoto: user.profilePhoto,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all Patients API - Doctor only
router.get("/patients", protect, doctorOnly, async (req, res) => {
  try {
    const patients = await User.find({ role: "patient" }).select("-password");
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
