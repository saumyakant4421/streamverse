const express = require("express");
const {
  sendOtp,
  verifyOtp,
  updateUserName,
  loginUser,
  forgotPassword,
  verifyGoogleToken,
  verifyToken, // Middleware for protected routes
  addToWatchlist,  
  getWatchlist,
  removeFromWatchlist,  
  clearWatchlist,
  // Add new controller methods for watched movies
  addToWatched,
  getWatched,
  removeFromWatched,
  clearWatched
} = require("../controllers/userController");

const router = express.Router();

// ✅ Authentication Routes
router.post("/send-otp", sendOtp); // Send OTP to email
router.post("/verify-otp", verifyOtp); // Verify OTP & Register user
router.post("/update-name", updateUserName); // Update name after registration
router.post("/login", loginUser); // Login user with email/password
router.post("/forgot-password", forgotPassword); // Send password reset email
router.post("/verify-google-token", verifyGoogleToken); // Google OAuth verification

// Watchlist routes
router.post("/watchlist/add", addToWatchlist); // Add movie to watchlist
router.get("/watchlist", getWatchlist);
router.delete("/watchlist/remove", removeFromWatchlist); 
router.delete("/watchlist/clear", clearWatchlist);

// Watched movies routes
router.post("/watched/add", addToWatched); // Add movie to watched list
router.get("/watched", getWatched); // Get all watched movies
router.delete("/watched/remove", removeFromWatched); // Remove movie from watched list
router.delete("/watched/clear", clearWatched); // Clear entire watched list

// ✅ Protected Routes (Use verifyToken Middleware if needed)
router.get("/protected-route", verifyToken, (req, res) => {
  res.json({ message: "You have access!", user: req.user });
});

module.exports = router;