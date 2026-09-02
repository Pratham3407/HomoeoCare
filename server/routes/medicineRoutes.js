const express = require("express");
const router = express.Router();
const Medicine = require("../models/Medicine");
const mongoose = require("mongoose");
const { protect, doctorOnly } = require("../middleware/auth");

// GET all medicines (public)
router.get("/", async (req, res, next) => {
  try {
    const medicines = await Medicine.find();
    res.json(medicines);
  } catch (error) {
    next(error);
  }
});

// POST — add a new medicine (doctor only)
router.post("/", protect, doctorOnly, async (req, res, next) => {
  const { name, description, price, stock } = req.body;

  const fieldErrors = {};

  if (!name || !name.trim()) {
    fieldErrors.name = "Please enter the medicine name.";
  }

  if (price === "" || price === null || price === undefined) {
    fieldErrors.price = "Please enter a price.";
  } else {
    const num = Number(price);
    if (isNaN(num) || num < 0) {
      fieldErrors.price = "Please enter a valid price.";
    }
  }

  if (stock !== undefined && stock !== "") {
    const num = Number(stock);
    if (isNaN(num) || num < 0 || !Number.isInteger(num)) {
      fieldErrors.stock = "Please enter a valid stock quantity.";
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return res.status(400).json({
      success: false,
      message: fieldErrors[Object.keys(fieldErrors)[0]],
      fieldErrors,
    });
  }

  try {
    const medicine = new Medicine({
      name: name.trim(),
      description: description || "",
      price: Number(price),
      stock: stock === "" || stock === undefined ? 0 : Number(stock),
    });
    await medicine.save();
    res.status(201).json({
      success: true,
      message: "Medicine added successfully.",
      medicine,
      fieldErrors: {},
    });
  } catch (error) {
    next(error);
  }
});

// PUT — update a medicine (doctor only)
router.put("/:id", protect, doctorOnly, async (req, res, next) => {
  const { name, description, price, stock } = req.body;

  const fieldErrors = {};

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "The medicine you're looking for could not be found.",
      fieldErrors: {},
    });
  }

  if (name !== undefined && !name.trim()) {
    fieldErrors.name = "Please enter the medicine name.";
  }

  if (price !== undefined && price !== "") {
    const num = Number(price);
    if (isNaN(num) || num < 0) {
      fieldErrors.price = "Please enter a valid price.";
    }
  }

  if (stock !== undefined && stock !== "") {
    const num = Number(stock);
    if (isNaN(num) || num < 0 || !Number.isInteger(num)) {
      fieldErrors.stock = "Please enter a valid stock quantity.";
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return res.status(400).json({
      success: false,
      message: fieldErrors[Object.keys(fieldErrors)[0]],
      fieldErrors,
    });
  }

  try {
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = Number(price);
    if (stock !== undefined) updateData.stock = Number(stock);

    const medicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true },
    );

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: "We couldn't find this medicine.",
        fieldErrors: {},
      });
    }

    res.json({
      success: true,
      message: "Medicine updated successfully.",
      medicine,
      fieldErrors: {},
    });
  } catch (error) {
    next(error);
  }
});

// DELETE — remove a medicine (doctor only)
router.delete("/:id", protect, doctorOnly, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "The medicine you're looking for could not be found.",
        fieldErrors: {},
      });
    }

    const medicine = await Medicine.findByIdAndDelete(req.params.id);
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: "We couldn't find this medicine.",
        fieldErrors: {},
      });
    }

    res.json({
      success: true,
      message: "Medicine deleted successfully.",
      fieldErrors: {},
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;