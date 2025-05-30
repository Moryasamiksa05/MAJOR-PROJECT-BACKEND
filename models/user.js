const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

// ✅ Fix OverwriteModelError — check before defining
module.exports = mongoose.models.User || mongoose.model("User", userSchema);
