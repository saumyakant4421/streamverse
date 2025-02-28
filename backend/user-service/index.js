const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const admin = require("./firebase"); // Use the updated Firebase config
const userRoutes = require("./routes/userRoutes");

// ✅ Load environment variables
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Ensure Firebase is initialized before using routes
console.log("Firebase Initialized Successfully.");

app.use("/api/user", userRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`User Service running on port ${PORT}`));
