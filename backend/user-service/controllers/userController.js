//backend/usercontroller
const { auth } = require("../firebase");
const otpGenerator = require("otp-generator");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const otpStore = new Map(); // Temporary OTP storage

// ✅ Generate Unique Username
const generateUsername = (email) => {
  const base = email.split("@")[0]; // Get part before @
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
