const express = require("express");
const {
  sendOtp,
  verifyOtp,
  updateUserName,
  loginUser,
  forgotPassword,
  verifyGoogleToken,
  verifyToken, // Middleware for protected routes
} = require("../controllers/userController");

const router = express.Router();

// ✅ Authentication Routes
router.post("/send-otp", sendOtp); // Send OTP to email
router.post("/verify-otp", verifyOtp); // Verify OTP & Register user
router.post("/update-name", updateUserName); // Update name after registration
router.post("/login", loginUser); // Login user with email/password
router.post("/forgot-password", forgotPassword); // Send password reset email
router.post("/verify-google-token", verifyGoogleToken); // Google OAuth verification

// ✅ Protected Routes (Use verifyToken Middleware if needed)
router.get("/protected-route", verifyToken, (req, res) => {
  res.json({ message: "You have access!", user: req.user });
});

module.exports = router;