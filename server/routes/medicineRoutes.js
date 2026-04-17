const express = require("express");
const router = express.Router();
const Medicine = require("../models/Medicine");
const { protect, doctorOnly } = require("../middleware/auth");

// GET all medicines (public)
router.get("/", async (req, res) => {
  try {
    const medicines = await Medicine.find();
    res.json(medicines);
  } catch (error) {
    res.status(500).json({ message: "Error fetching medicines" });
  }
});

// POST — add a new medicine (doctor only)
router.post("/", protect, doctorOnly, async (req, res) => {
  const { name, description, price, stock } = req.body;

  try {
    const medicine = new Medicine({ name, description, price, stock });
    await medicine.save();
    res.status(201).json({ message: "Medicine added", medicine });
  } catch (error) {
    res.status(500).json({ message: "Error adding medicine" });
  }
});

// PUT — update a medicine (doctor only)
router.put("/:id", protect, doctorOnly, async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    res.json(medicine);
  } catch (error) {
    res.status(500).json({ message: "Error updating medicine" });
  }
});

// DELETE — remove a medicine (doctor only)
router.delete("/:id", protect, doctorOnly, async (req, res) => {
  try {
    await Medicine.findByIdAndDelete(req.params.id);
    res.json({ message: "Medicine deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting medicine" });
  }
});

module.exports = router;
