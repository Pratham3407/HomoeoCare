const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role }
    next();
  } catch (error) {
    return res.status(401).json({ message: "Session expired, please log in again" });
  }
};

// Doctor-only middleware
const doctorOnly = (req, res, next) => {
  if (req.user?.role !== "doctor") {
    return res.status(403).json({ message: "Access denied: doctors only" });
  }
  next();
};

// Patient-only middleware
const patientOnly = (req, res, next) => {
  if (req.user?.role !== "patient") {
    return res.status(403).json({ message: "Access denied: patients only" });
  }
  next();
};

module.exports = { protect, doctorOnly, patientOnly };
