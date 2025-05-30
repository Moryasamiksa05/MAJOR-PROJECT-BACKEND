const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const admin = require("./firebaseAdmin"); // Firebase Admin SDK
const User = require("./models/User"); // Correct path to your User model

dotenv.config(); // Load environment variables

const app = express();

// ================= Middleware =================
// Set up CORS middleware first (allow all origins or specify as needed)
app.use(cors({
  origin: "*" //  "http://localhost:5173"
}));

// Use built-in express JSON and URL-encoded parsers with increased body size limits
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Serve static files from "uploads" folder
app.use("/uploads", express.static("uploads"));

// ================= MongoDB Connection =================
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ================= Firebase + MongoDB Auth Routes =================

// 🔐 User Registration (Firebase + MongoDB)
app.post("/register", async (req, res) => {
  const { email, phone, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    const firebaseUser = await admin.auth().createUser({ email, password });

    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({ email, phone, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: "User registered successfully", firebaseUser });
  } catch (error) {
    console.error("❌ Register Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// 🔐 User Login (JWT Token)
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({  id: user._id,email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error("❌ Login Error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// 🔄 Forgot Password (Firebase)
app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    await admin.auth().getUserByEmail(email);
    const resetLink = await admin.auth().generatePasswordResetLink(email);
    console.log("✅ Reset Link:", resetLink);
    res.json({ message: "Password reset link sent", resetLink });
  } catch (error) {
    console.error("❌ Forgot Password Error:", error.message);
    res.status(500).json({ message: "Error sending reset link", error: error.message });
  }
});

// 🔄 Update Password (Firebase + MongoDB)
app.post("/update-password", async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    await admin.auth().updateUser(userRecord.uid, { password: newPassword });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findOneAndUpdate({ email }, { password: hashedPassword });

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("❌ Password Update Error:", error.message);
    res.status(500).json({ message: "Error updating password", error: error.message });
  }
});

// ✅ Send Verification Email
app.post("/send-verification-email", async (req, res) => {
  const { email } = req.body;
  try {
    await admin.auth().getUserByEmail(email);
    const verificationLink = await admin.auth().generateEmailVerificationLink(email);
    console.log("✅ Verification Link:", verificationLink);
    res.json({ message: "Email verification link sent", verificationLink });
  } catch (error) {
    console.error("❌ Email Verification Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ================= Provider Routes =================

const providerSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  serviceName: { type: String, required: true },
  expertise: { type: String, required: true },
  availableLocation: { type: String, required: true },
  currentLocation: { type: String, required: true },
  email: { type: String, required: true },
  contact: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  availableTime: { type: String, required: true }, // e.g. "9:00 AM"
  cvFileName: { type: String },
  photo: { type: String, required: true }, // Base64 encoded image string
});

const Provider = mongoose.model("Provider", providerSchema);

app.get("/providers", async (req, res) => {
  try {
    const providers = await Provider.find();
    res.json(providers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Create new provider
app.post("/providers", async (req, res) => {
  try {
    const provider = new Provider(req.body);
    await provider.save();
    res.status(201).json(provider);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT: Update provider by id
app.put("/providers/:id", async (req, res) => {
  try {
    const provider = await Provider.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!provider) {
      return res.status(404).json({ error: "Provider not found" });
    }
    res.json(provider);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE: Delete provider by id
app.delete("/providers/:id", async (req, res) => {
  try {
    const provider = await Provider.findByIdAndDelete(req.params.id);
    if (!provider) {
      return res.status(404).json({ error: "Provider not found" });
    }
    res.json({ message: "Provider deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Chatbot
const responses = {
  "hi": "Hello! How can I assist you?",
  "hello": "Hi there! How can I help?",
  "bye": "Goodbye! Have a great day!",
  "how are you": "I'm just a bot, but I'm doing great! How about you?",
  "phone no":"789456123",
  
  
};

app.post("/chat", (req, res) => {
  const userMessage = req.body.message.toLowerCase();
  const botResponse = responses[userMessage] || "Sorry, I don't understand. you can call this number for further enquiry 6307593809";
  res.json({ reply: botResponse });
});



// GET endpoint to fetch all feedbacks (for admin viewing)

// ================= Custom Routes =================

// 🧾 User Booking Routes
const bookingRoutes = require("./routes/bookings.js");
app.use("/api/bookings", bookingRoutes);

// 🧑‍💻 Admin Auth Routes
const adminAuthRoutes = require("./routes/adminAuth.js");
app.use("/admin", adminAuthRoutes);

// 🧑‍💼 Admin Booking & Service Management Routes
const adminBookingsRoute = require("./routes/adminBookings.js");
app.use("/admin", adminBookingsRoute);  // Mount at /admin

const feedbackRoutes = require("./routes/feedback");
app.use("/api/bookings", feedbackRoutes); 


const paymentRoutes = require("./routes/payment");
app.use("/api", paymentRoutes);




// ================= Server Listen =================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🔥 Server running on port ${PORT}`));
