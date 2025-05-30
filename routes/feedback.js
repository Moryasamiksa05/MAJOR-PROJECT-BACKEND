const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking"); 
const Feedback = require("../models/feedback"); // Import Feedback model
const verifyToken = require("../middlewares/verifyToken");

// POST /api/bookings/:bookingId/feedback
router.post("/:bookingId/feedback", verifyToken, async (req, res) => {
  const { bookingId } = req.params;
  const { rating, feedback } = req.body;
  const userId = req.user.id; 

  try {
    // Find booking by ID
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Ensure the logged-in user owns this booking
    if (booking.userId.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to submit feedback for this booking" });
    }

    console.log("Booking User ID:", booking.userId.toString());
    console.log("Logged-in User ID:", userId);

    // ✅ Create a new feedback entry in the Feedback model
    const newFeedback = new Feedback({
      bookingId: booking._id,
      rating,
      feedback,
    });

    await newFeedback.save();

    res.status(201).json({ message: "Feedback submitted successfully", newFeedback });
  } catch (err) {
    console.error("❌ Feedback submission error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
