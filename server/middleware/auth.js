const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Please sign in to continue.",
      fieldErrors: {},
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role }
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Your session has expired. Please sign in again.",
      fieldErrors: {},
    });
  }
};

// Doctor-only middleware
const doctorOnly = (req, res, next) => {
  if (req.user?.role !== "doctor") {
    return res.status(403).json({
      success: false,
      message: "You don't have permission to access this area.",
      fieldErrors: {},
    });
  }
  next();
};

// Patient-only middleware
const patientOnly = (req, res, next) => {
  if (req.user?.role !== "patient") {
    return res.status(403).json({
      success: false,
      message: "You don't have permission to access this area.",
      fieldErrors: {},
    });
  }
  next();
};

module.exports = { protect, doctorOnly, patientOnly };