
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const adminController = require("../controllers/adminController");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const Booking = require("../models/Booking");  // ✅ Booking model added
const JWT_SECRET = process.env.JWT_SECRET;

// ✅ Multer Storage Setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// ==================== Middleware ====================

// ✅ JWT Verification Middleware for Admin Routes
const verifyAdminToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const admin = await Admin.findById(decoded.id);
    if (!admin) return res.status(401).json({ message: "Invalid token" });

    req.admin = admin; // Attach admin to request for further use
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// ==================== ROUTES ====================

// ✅ Register Admin (with profileImage upload)
router.post("/register", upload.single("profileImage"), adminController.registerAdmin);

// ✅ Login Admin
router.post("/login", adminController.loginAdmin);

// ✅ Forgot Password - Check Email Exists
router.post("/check-email", adminController.checkEmail);

// ✅ Update Password
router.post("/update-password", adminController.updatePassword);

// ✅ Admin Dashboard - Protected Route to get admin info
router.get("/dashboard", verifyAdminToken, (req, res) => {
  const { name, email, profileImage } = req.admin;
  res.json({ name, email, profileImage });
});

// ✅ Get All Bookings (Protected)
router.get("/admin/bookings", verifyAdminToken, adminController.getAllBookings);

// ✅ Delete Booking by ID (Protected)
router.delete("/admin/bookings/:id", verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    await Booking.findByIdAndDelete(id);
    res.json({ success: true, message: "Booking deleted successfully" });
  } catch (err) {
    console.error("❌ Delete Booking Error:", err.message);
    res.status(500).json({ success: false, message: "Failed to delete booking" });
  }
});

// ✅ Update Booking Status (Protected)
router.put('/admin/bookings/:id/status', verifyAdminToken, async (req, res) => {
  const { id } = req.params;
  const { newStatus } = req.body;

  try {
    await Booking.findByIdAndUpdate(id, { paymentStatus: newStatus });
    res.json({ success: true, message: "Status updated successfully" });
  } catch (err) {
    console.error("❌ Status Update Error:", err.message);
    res.status(500).json({ success: false, message: "Failed to update status" });
  }
});

module.exports = router;
