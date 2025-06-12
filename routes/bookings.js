
const express = require("express");
const User = require("../models/user"); //  Properly import User model
const Booking = require("../models/Booking");
const verifyToken = require("../middlewares/verifyToken");

const router = express.Router();

//  Save Booking with userId from MongoDB (linked via email)
router.post("/", verifyToken, async (req, res) => {
  try {
    console.log(" [POST] Booking: Token User Email:", req.user.email);  //
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      console.log(" User not found for booking");  //  Log 2
      return res.status(404).json({ message: "User not found" });
    }

    console.log(" User Found:", user._id);  //  Log 3

    const bookingData = {
      ...req.body,
      userId: user._id.toString(),  //  Save correct userId
    };

    const booking = new Booking(bookingData);
    const saved = await booking.save();

    console.log(" Booking Saved:", saved);  //  Log 4
    res.status(201).json({ message: "Booking saved", booking: saved });
  } catch (err) {
    console.error("Booking Save Error:", err);  //  Log 5
    res.status(500).json({ message: "Error saving booking", err });
  }
});

//  Fetch Bookings for Logged-in User
router.get("/my", verifyToken, async (req, res) => {
  try {
    console.log(" [GET] Fetch Bookings: Token User Email:", req.user.email);  //  Log 1

    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      console.log(" User not found while fetching bookings");  // Log 2
      return res.status(404).json({ message: "User not found" });
    }

    console.log(" User Found:", user._id);  //Log 3

    const bookings = await Booking.find({ userId: user._id.toString() }).sort({ createdAt: -1 });
    console.log(" Bookings Found:", bookings.length);  // Log 4
    if (bookings.length > 0) {
      console.log(" First Booking:", bookings[0]);  // Optional: Check first booking
    }

    res.status(200).json({ bookings });
  } catch (error) {
    console.error(" Fetch user bookings error:", error);  //  Log 5
    res.status(500).json({ message: "Server Error" });
  }
});

//  Cancel Booking (User can delete only own bookings)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    console.log(" [DELETE] Booking: Token User Email:", req.user.email);  //  Log 1

    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      console.log(" User not found while cancelling booking");  // Log 2
      return res.status(404).json({ message: "User not found" });
    }

    const bookingId = req.params.id;
    console.log(" Booking ID to cancel:", bookingId);  //  Log 3

    const booking = await Booking.findOne({ _id: bookingId, userId: user._id.toString() });

    if (!booking) {
      console.log(" Booking not found or not authorized");  //  Log 4
      return res.status(404).json({ message: "Booking not found or not authorized" });
    }

    await Booking.deleteOne({ _id: bookingId });
    console.log("Booking Cancelled:", bookingId);  //  Log 5
    res.status(200).json({ message: "Booking cancelled" });
  } catch (error) {
    console.error(" Cancel booking error:", error);  //  Log 6
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
