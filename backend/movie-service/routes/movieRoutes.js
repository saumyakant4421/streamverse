const express = require("express");
const {
  getTrendingMovies,
  getMovieDetails,
  getMoviesByGenre,
  getMoviesByFranchise,
} = require("../controllers/movieController");

const router = express.Router();

router.get("/trending", getTrendingMovies);
router.get("/genres/:genre", getMoviesByGenre);
router.get("/franchises/:franchise", getMoviesByFranchise);
router.get("/:id", getMovieDetails);

module.exports = router;

