const {
    fetchTrendingMovies,
    fetchMovieDetails,
    fetchMoviesByGenre,
    fetchMoviesByFranchise,
    GENRES,
    FRANCHISES,
  } = require("../services/movieService");
  
  const getTrendingMovies = async (req, res) => {
    try {
      const movies = await fetchTrendingMovies();
      res.json(movies);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trending movies" });
    }
  };
  
  const getMovieDetails = async (req, res) => {
    try {
      const movie = await fetchMovieDetails(req.params.id);
      res.json(movie);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch movie details" });
    }
  };
  
  const getMoviesByGenre = async (req, res) => {
    const genreKey = Object.keys(GENRES).find(
      (key) => key.toLowerCase() === req.params.genre.toLowerCase()
    );
    if (!genreKey) return res.status(400).json({ error: "Invalid genre" });
    try {
      const movies = await fetchMoviesByGenre(GENRES[genreKey]);
      res.json(movies);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch movies by genre" });
    }
  };
  
  const getMoviesByFranchise = async (req, res) => {
    const franchiseKey = Object.keys(FRANCHISES).find(
      (key) => key.toLowerCase() === req.params.franchise.toLowerCase()
    );
    if (!franchiseKey) return res.status(400).json({ error: "Invalid franchise" });
    try {
      const movies = await fetchMoviesByFranchise(FRANCHISES[franchiseKey]);
      res.json(movies);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch franchise movies" });
    }
  };
  
  module.exports = { getTrendingMovies, getMovieDetails, getMoviesByGenre, getMoviesByFranchise };
  
  