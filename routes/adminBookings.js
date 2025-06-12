const express = require('express');
const router = express.Router();
const verifyAdminToken = require('../middlewares/verifyAdmin');
const adminController = require('../controllers/adminController');
const Booking = require('../models/Booking');
const Service = require('../models/Service');

// ================= Get All Bookings =================
router.get('/bookings', verifyAdminToken, adminController.getAllBookings);

// ================= Get All Services =================
router.get('/services', verifyAdminToken, async (req, res) => {
  try {

    const services = await Service.find().sort({ createdAt: -1 });
    const bookings = await Booking.find().populate("feedback");
    res.json({ success: true, services });
  } catch (err) {
    console.error("Service Fetch Error:", err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch services' });
  }
});

// ================= Delete Booking =================
router.delete('/bookings/:id', verifyAdminToken, async (req, res) => {
  try {
    const deleted = await Booking.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    res.json({ success: true, message: 'Booking deleted successfully' });
  } catch (err) {
    console.error(" Booking Delete Error:", err.message);
    res.status(500).json({ success: false, message: 'Failed to delete booking' });
  }
});

// ================= Delete Service =================
router.delete('/services/:id', verifyAdminToken, async (req, res) => {
  try {
    const deleted = await Service.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    res.json({ success: true, message: 'Service deleted successfully' });
  } catch (err) {
    console.error(" Service Delete Error:", err.message);
    res.status(500).json({ success: false, message: 'Failed to delete service' });
  }
});

// ================= Update Booking Status =================
router.put('/bookings/:id/status', verifyAdminToken, async (req, res) => {
  const { id } = req.params;
  const { newStatus, statusType } = req.body;  // tatusType: 'payment' ya 'service'

  try {
    let updateField = {};

    if (statusType === 'payment') {
      updateField.paymentStatus = newStatus;
    } else if (statusType === 'service') {
      updateField.serviceStatus = newStatus;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid status type' });
    }

    const booking = await Booking.findByIdAndUpdate(id, updateField, { new: true });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.json({ success: true, message: `${statusType} status updated successfully`, booking });
  } catch (err) {
    console.error(" Booking Status Update Error:", err.message);
    res.status(500).json({ success: false, message: 'Failed to update booking status' });
  }
});

// ================= Export Router =================
module.exports = router;  //  This line is required
