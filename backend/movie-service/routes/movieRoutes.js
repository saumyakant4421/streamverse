const express = require("express");
const {
  getTrendingMovies,
  getMovieDetails,
  getMoviesByGenre,
  getMoviesByFranchise,
  searchMovies,
  getSimilarMovies,
} = require("../controllers/movieController");

const router = express.Router();

router.get("/trending", getTrendingMovies);
router.get("/search", searchMovies);  // Add this route
router.get("/genres/:genre", getMoviesByGenre);
router.get("/franchises/:franchise", getMoviesByFranchise);
router.get("/:id", getMovieDetails);
router.get("/:id/similar", getSimilarMovies);


module.exports = router;