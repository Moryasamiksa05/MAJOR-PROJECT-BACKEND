const Admin = require("../models/Admin");
const Booking = require('../models/Booking');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

// ========================= REGISTER ADMIN =========================
exports.registerAdmin = async (req, res) => {
    const { name, email, password } = req.body;
    const profileImagePath = req.file ? `/uploads/${req.file.filename}` : null;

    try {
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ message: "Email already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const admin = new Admin({
            name,
            email,
            password: hashedPassword,
            profileImage: profileImagePath
        });

        await admin.save();
        res.json({ message: "Admin registered successfully" });

    } catch (err) {
        console.error("Register Error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ========================= LOGIN ADMIN =========================
exports.loginAdmin = async (req, res) => {
    const { email, password } = req.body;

    try {
        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // ✅ Add role here
        const token = jwt.sign({ id: admin._id, role: "admin" }, JWT_SECRET, { expiresIn: "1h" });

        res.json({ message: "Login successful", token });

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ message: "Server error" });
    }
};


// ========================= UPDATE PASSWORD =========================
exports.updatePassword = async (req, res) => {
    const { email, newPassword } = req.body;

    try {
        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(400).json({ message: "Email not found" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        admin.password = hashedPassword;
        await admin.save();

        res.json({ message: "Password updated successfully" });

    } catch (err) {
        console.error("Update Password Error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ========================= CHECK EMAIL FOR FORGOT PASSWORD =========================
exports.checkEmail = async (req, res) => {
    const { email } = req.body;

    try {
        const admin = await Admin.findOne({ email });

        if (admin) {
            res.json({ exists: true });
        } else {
            res.status(404).json({ exists: false, message: "Email not found" });
        }

    } catch (err) {
        console.error("Check Email Error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// controllers/adminController.js
exports.updateBookingStatus = async (req, res) => {
    const { id } = req.params;
    const { newStatus, statusType } = req.body;

    const allowedServiceStatuses = ["Scheduled", "Cancelled", "On the Way", "Not Available", "Fulfilled"];
    const allowedPaymentStatuses = ["Pending", "Paid", "Failed"];

    try {
        const booking = await Booking.findById(id);
        if (!booking) return res.status(404).json({ message: "Booking not found" });

        if (statusType === "service") {
            if (!allowedServiceStatuses.includes(newStatus)) {
                return res.status(400).json({ message: "Invalid service status value" });
            }
            booking.serviceStatus = newStatus;
        } else if (statusType === "payment") {
            if (!allowedPaymentStatuses.includes(newStatus)) {
                return res.status(400).json({ message: "Invalid payment status value" });
            }
            booking.paymentStatus = newStatus;
        } else {
            return res.status(400).json({ message: "Invalid status type" });
        }

        await booking.save();

        res.json({ message: `${statusType} status updated successfully`, booking });
    } catch (err) {
        console.error(" Status Update Error:", err.message);
        res.status(500).json({ message: "Failed to update status" });
    }
};



// ========================= GET ALL BOOKINGS =========================
exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find().sort({ createdAt: -1 }); // latest bookings first

        // Optional: format response (for frontend ease)
        const formattedBookings = bookings.map(b => ({
            _id: b._id,
            service: b.service,
            name: b.name,
            phone: b.phone,
            district: b.district,
            pinCode: b.pinCode,
            address: b.address,
            date: b.date,
            time: b.time,
            payment: b.payment,
            paymentStatus: b.paymentStatus,
            createdAt: b.createdAt,
        }));

        res.json({ success: true, bookings: formattedBookings });
    } catch (err) {
        console.error(" Get All Bookings Error:", err.message);
        res.status(500).json({ message: "Failed to fetch bookings" });
    }
};
