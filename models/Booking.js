// models/Booking.js
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  service: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  district: { type: String, required: true },
  pinCode: { type: String, required: true },
  address: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  payment: { type: String, required: true },
  
  paymentStatus: { type: String, default: 'Pending' },

  serviceStatus: {
    type: String,
    enum: ['Pending', 'On the Way', 'Fulfilled', 'Cancelled', 'Not Available'],
    default: 'Pending'
  },
  

  // ✅ Add this 
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },


}, { timestamps: true });
// Virtual field for feedback
bookingSchema.virtual("feedback", {
  ref: "Feedback",           // Feedback model name
  localField: "_id",         // Booking document's _id
  foreignField: "bookingId", // Feedback model me bookingId field
  justOne: true              // Assume one feedback per booking; agar multiple hain, to false karein.
});

// Ensure virtual fields are included in JSON and object outputs
bookingSchema.set("toObject", { virtuals: true });
bookingSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model('Booking', bookingSchema);

