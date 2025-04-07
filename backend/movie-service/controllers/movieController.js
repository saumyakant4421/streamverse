const {
    fetchTrendingMovies,
    fetchMovieDetails,
    fetchMoviesByGenre,
    fetchMoviesByFranchise,
    GENRES,
    FRANCHISES,
  } = require("../services/movieService");


  const axios = require("axios");
  require('dotenv').config();
  
  const GENRE_ALIASES = {
    SciFi: "Science Fiction" // ✅ Map "SciFi" to "Science Fiction"
  };

  const TMDB_API_KEY = process.env.TMDB_API_KEY;
  const TMDB_BASE_URL = "https://api.themoviedb.org/3";
  
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
  let genreName = req.params.genre;
  
  // Convert alias if needed
  if (GENRE_ALIASES[genreName]) {
    genreName = GENRE_ALIASES[genreName];
  }

  const genreKey = Object.keys(GENRES).find(
    (key) => key.toLowerCase() === genreName.toLowerCase()
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
  
  // New Search Movies Function
  const searchMovies = async (req, res) => {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: "Search query is required" });
    }
  
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
        params: {
          api_key: TMDB_API_KEY,
          query,
          page: 1,
          include_adult: false
        }
      });
  
      if (response.data && response.data.results) {
        res.json(response.data.results);
      } else {
        res.status(404).json({ error: "No movies found" });
      }
    } catch (error) {
      console.error("Search Movies Error:", error.response?.data || error.message);
      res.status(500).json({ error: "Failed to search movies" });
    }
  };

  const getSimilarMovies = async (req, res) => {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/movie/${req.params.id}/similar`, {
        params: {
          api_key: TMDB_API_KEY,
        }
      });
      res.json(response.data.results);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch similar movies" });
    }
  };
  
  
  module.exports = { 
    getTrendingMovies, 
    getMovieDetails, 
    getMoviesByGenre, 
    getMoviesByFranchise,
    searchMovies,
    getSimilarMovies
  };