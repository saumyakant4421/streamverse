const axios = require("axios");
require('dotenv').config();
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

const GENRES = {
    Action: 28,
    Adventure: 12,
    Animation: 16,
    Comedy: 35,
    Crime: 80,
    Documentary: 99,
    Drama: 18,
    Fantasy: 14,
    Horror: 27,
    "Science Fiction": 878 // ✅ Correct key
  };
  
  

const FRANCHISES = {
  Marvel: 420818,
  DC: 297762,
  HarryPotter: 12445,
  StarWars: 11,
  JurassicPark: 329,
  LordOfTheRings: 120,
  FastAndFurious: 82992
};

const fetchTrendingMovies = async () => {
  const url = `${TMDB_BASE_URL}/trending/movie/week`;
  const params = { api_key: TMDB_API_KEY };
  
  console.log(`Fetching trending movies from: ${url}`);
  console.log(`API Key present: ${Boolean(TMDB_API_KEY)}`);
  
  try {
    const response = await axios.get(url, { params });
    return response.data.results;
  } catch (error) {
    console.error("Error fetching trending movies:");
    console.error(`Status: ${error.response?.status}`);
    console.error(`Message: ${error.message}`);
    if (error.response?.data) {
      console.error("API Error:", error.response.data);
    }
    return [];
  }
};

const fetchMovieDetails = async (movieId) => {
  const url = `${TMDB_BASE_URL}/movie/${movieId}`;
  const params = { api_key: TMDB_API_KEY, append_to_response: "credits,videos" };
  
  console.log(`Fetching movie details from: ${url}`);
  
  try {
    const response = await axios.get(url, { params });
    return response.data;
  } catch (error) {
    console.error(`Error fetching movie details for ID ${movieId}:`);
    console.error(`Status: ${error.response?.status}`);
    console.error(`Message: ${error.message}`);
    if (error.response?.data) {
      console.error("API Error:", error.response.data);
    }
    return null;
  }
};

const fetchMoviesByGenre = async (genreId, page = 1) => {
    const url = `${TMDB_BASE_URL}/discover/movie`;
    const params = { 
      api_key: TMDB_API_KEY, 
      with_genres: genreId,
      page: page // ✅ Define page properly
    };
    
    console.log(`Fetching movies by genre ID ${genreId} from: ${url}`);
  
    try {
      const response = await axios.get(url, { params });
      return response.data.results;
    } catch (error) {
      console.error(`Error fetching movies for genre ID ${genreId}:`);
      console.error(`Status: ${error.response?.status}`);
      console.error(`Message: ${error.message}`);
      if (error.response?.data) {
        console.error("API Error:", error.response.data);
      }
      return [];
    }
  };
  

const fetchMoviesByFranchise = async (collectionId) => {
  const url = `${TMDB_BASE_URL}/collection/${collectionId}`;
  const params = { api_key: TMDB_API_KEY };
  
  console.log(`Fetching franchise movies for collection ID ${collectionId} from: ${url}`);
  
  try {
    const response = await axios.get(url, { params });
    return response.data.parts;
  } catch (error) {
    console.error(`Error fetching franchise movies for collection ID ${collectionId}:`);
    console.error(`Status: ${error.response?.status}`);
    console.error(`Message: ${error.message}`);
    if (error.response?.data) {
      console.error("API Error:", error.response.data);
    }
    return [];
  }
};

module.exports = {
  fetchTrendingMovies,
  fetchMovieDetails,
  fetchMoviesByGenre,
  fetchMoviesByFranchise,
  GENRES,
  FRANCHISES
};