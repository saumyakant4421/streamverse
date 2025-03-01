const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const movieRoutes = require("./routes/movieRoutes");

dotenv.config();
if (!process.env.TMDB_API_KEY) {
    console.error("ERROR: TMDB_API_KEY is not set in environment variables");
    console.error("Please create a .env file with your TMDB API key");
    process.exit(1);
  }

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/movies", movieRoutes);

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => console.log(`Movie Service running on port ${PORT}`));

// Handle unexpected errors
defaultErrorHandler = (err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({ error: "Internal Server Error" });
};
app.use(defaultErrorHandler);

process.on("uncaughtException", (err) => console.error("Uncaught Exception:", err));
process.on("unhandledRejection", (reason) => console.error("Unhandled Rejection:", reason));
