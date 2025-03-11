//backend/usercontroller
const { auth } = require("../firebase");
const otpGenerator = require("otp-generator");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const otpStore = new Map(); // Temporary OTP storage

// ✅ Generate Unique Username
const generateUsername = (email) => {
    const base = email.split("@")[0].substring(0, 6); // Get first 6 letters before @
    const randomNum = Math.floor(1000 + Math.random() * 9000); // Random 4-digit number
    return `${base}_${randomNum}`;
};

// ✅ Send OTP
exports.sendOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    console.log(`📩 Sending OTP to: ${email}`);

    const otp = otpGenerator.generate(6, { digits: true, upperCase: false, specialChars: false });
    otpStore.set(email, { otp, expiresAt: Date.now() + 300000 });

    // Send OTP via email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL, pass: process.env.EMAIL_PASSWORD },
    });

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "Streamverse OTP Verification",
      text: `Your OTP is: ${otp}. It expires in 5 minutes.`,
    });

    console.log("✅ OTP sent successfully!");
    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("❌ Error sending OTP:", error);
    res.status(500).json({ error: "Failed to send OTP" });
  }
};

// ✅ Verify OTP & Register User (Without Name)
exports.verifyOtp = async (req, res) => {
    const { email, otp, password } = req.body;
  
    if (!email || !otp || !password || password.length < 6) {
      return res.status(400).json({ error: "Invalid data. Ensure email, OTP, and password (min 6 chars) are provided." });
    }
  
    console.log(`📩 Verifying OTP for: ${email}`);
  
    const storedOtp = otpStore.get(email);
    if (!storedOtp || storedOtp.otp !== otp || Date.now() > storedOtp.expiresAt) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }
  
    otpStore.delete(email);
  
    try {
      console.log("✅ OTP Verified! Creating user...");
  
      const hashedPassword = await bcrypt.hash(password, 10);
      const username = generateUsername(email);
  
      // Store in Firebase Authentication
      const user = await auth.createUser({
        email,
        password,
      });
  
      // Check Firestore if user exists
      const db = require("../firebase").db;
      const userRef = db.collection("users").doc(user.uid);
      const userDoc = await userRef.get();
  
      if (!userDoc.exists) {
        await userRef.set({
          email,
          username,
          name: "", // User will enter this later
          createdAt: new Date(),
        });
      }
  
      res.status(201).json({ uid: user.uid, email, username, message: "User registered successfully!" });
    } catch (error) {
      console.error("❌ Error creating user:", error);
      res.status(400).json({ error: error.message });
    }
  };

  
// ✅ Update Name After Account Creation
exports.updateUserName = async (req, res) => {
  const { uid, name } = req.body;

  if (!uid || !name) return res.status(400).json({ error: "User ID and name are required." });

  try {
    const db = require("../firebase").db;
    await db.collection("users").doc(uid).update({ name });

    await auth.updateUser(uid, { displayName: name });

    res.status(200).json({ message: "Name updated successfully!" });
  } catch (error) {
    console.error("❌ Error updating name:", error);
    res.status(500).json({ error: "Failed to update name." });
  }
};

// ✅ Login User
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Verify Firebase User
    const userRecord = await auth.getUserByEmail(email);
    if (!userRecord) return res.status(400).json({ error: "User not found!" });

    // Generate JWT Token
    const token = jwt.sign(
      { uid: userRecord.uid, email: userRecord.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({ message: "Login successful!", token });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(400).json({ error: "Invalid credentials!" });
  }
};

// ✅ Forgot Password - Send Reset Email
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const link = await auth.generatePasswordResetLink(email);

    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL, pass: process.env.EMAIL_PASSWORD },
    });

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "Streamverse Password Reset",
      text: `Click the link to reset your password: ${link}`,
    });

    res.status(200).json({ message: "Password reset email sent!" });
  } catch (error) {
    res.status(500).json({ error: "Failed to send reset email" });
  }
};

// ✅ Verify Google Token (Google Sign-In)
exports.verifyGoogleToken = async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "Google token is required." });
  
    try {
      const decodedToken = await auth.verifyIdToken(token);
      const user = await auth.getUser(decodedToken.uid);
  
      const db = require("../firebase").db;
      const userRef = db.collection("users").doc(user.uid);
      const userDoc = await userRef.get();
  
      let username;
  
      if (!userDoc.exists) {
        username = generateUsername(user.email);
        await userRef.set({
          email: user.email,
          username,
          name: user.displayName || "",
          createdAt: new Date(),
        });
      } else {
        username = userDoc.data().username;
      }
  
      res.status(200).json({ uid: user.uid, email: user.email, username, message: "Google authentication successful" });
    } catch (error) {
      res.status(400).json({ error: "Invalid Google token." });
    }
  };
  
// ✅ Middleware: Verify JWT Token
exports.verifyToken = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ message: "Access Denied!" });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(400).json({ message: "Invalid Token!" });
  }
};

// Add movie to watchlist
exports.addToWatchlist = async (req, res) => {
    try {
      const { id, title, poster, uid } = req.body;
      
      if (!id || !title || !poster || !uid) {
        return res.status(400).json({ error: "Missing required fields" });
      }
  
      const db = require("../firebase").db;
      const watchlistRef = db.collection("watchlists").doc(uid);
      const watchlistDoc = await watchlistRef.get();
  
      if (!watchlistDoc.exists) {
        // Create new watchlist for user
        await watchlistRef.set({
          movies: [{ id, title, poster, addedAt: new Date() }]
        });
      } else {
        // Update existing watchlist
        const watchlist = watchlistDoc.data();
        
        // Check if movie already exists in watchlist
        const movieExists = watchlist.movies.some(movie => movie.id === id);
        if (movieExists) {
          return res.status(400).json({ error: "Movie already in watchlist" });
        }
        
        // Add movie to watchlist
        await watchlistRef.update({
          movies: [...watchlist.movies, { id, title, poster, addedAt: new Date() }]
        });
      }
  
      res.status(200).json({ message: "Movie added to watchlist" });
    } catch (error) {
      console.error("Error adding to watchlist:", error);
      res.status(500).json({ error: "Failed to add movie to watchlist" });
    }
  };
  
  // Get user's watchlist
  exports.getWatchlist = async (req, res) => {
    try {
      const { uid } = req.query;
      
      if (!uid) {
        return res.status(400).json({ error: "User ID is required" });
      }
  
      const db = require("../firebase").db;
      const watchlistRef = db.collection("watchlists").doc(uid);
      const watchlistDoc = await watchlistRef.get();
  
      if (!watchlistDoc.exists) {
        return res.status(200).json([]); // Return empty array if no watchlist
      }
  
      const watchlist = watchlistDoc.data();
      // Sort by most recently added
      const sortedMovies = watchlist.movies.sort((a, b) => 
        b.addedAt.toDate() - a.addedAt.toDate()
      );
  
      res.status(200).json(sortedMovies);
    } catch (error) {
      console.error("Error fetching watchlist:", error);
      res.status(500).json({ error: "Failed to fetch watchlist" });
    }
  };

// Remove movie from watchlist
exports.removeFromWatchlist = async (req, res) => {
    try {
      const { uid, movieId } = req.query;
      
      if (!uid || !movieId) {
        return res.status(400).json({ error: "User ID and Movie ID are required" });
      }
  
      const db = require("../firebase").db;
      const watchlistRef = db.collection("watchlists").doc(uid);
      const watchlistDoc = await watchlistRef.get();
  
      if (!watchlistDoc.exists) {
        return res.status(404).json({ error: "Watchlist not found" });
      }
  
      const watchlist = watchlistDoc.data();
      const updatedMovies = watchlist.movies.filter(movie => movie.id !== parseInt(movieId));
      
      await watchlistRef.update({ movies: updatedMovies });
  
      res.status(200).json({ message: "Movie removed from watchlist" });
    } catch (error) {
      console.error("Error removing from watchlist:", error);
      res.status(500).json({ error: "Failed to remove movie from watchlist" });
    }
  };
  
  // Clear entire watchlist
  exports.clearWatchlist = async (req, res) => {
    try {
      const { uid } = req.query;
      
      if (!uid) {
        return res.status(400).json({ error: "User ID is required" });
      }
  
      const db = require("../firebase").db;
      const watchlistRef = db.collection("watchlists").doc(uid);
      
      await watchlistRef.update({ movies: [] });
  
      res.status(200).json({ message: "Watchlist cleared" });
    } catch (error) {
      console.error("Error clearing watchlist:", error);
      res.status(500).json({ error: "Failed to clear watchlist" });
    }
  };