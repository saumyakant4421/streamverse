import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import "../styles/homepage.scss";

const API_BASE_URL = "http://localhost:4001/api/movies"; // Backend API

const genres = [
  "Action", "Adventure", "Animation", "Comedy",
  "Crime", "Documentary", "Drama", "Fantasy",
  "Horror", "SciFi"
];

const franchises = [
  "Marvel", "DC", "HarryPotter", "StarWars",
  "JurassicPark", "LordOfTheRings", "FastAndFurious",
  "Transformers", "MissionImpossible", "Spiderman",
  "XMen", "JohnWick"
];

const Homepage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [trendingMovies, setTrendingMovies] = useState([]);
  const [genreMovies, setGenreMovies] = useState({});
  const [franchiseMovies, setFranchiseMovies] = useState({});
  const [watchlist, setWatchlist] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate("/login"); // Redirect to login if not authenticated
      return;
    }

    fetchTrendingMovies();
    fetchGenreMovies();
    fetchFranchiseMovies();
    fetchWatchlist();
  }, [user]);

  // Fetch trending movies
  const fetchTrendingMovies = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/trending`);
      setTrendingMovies(response.data);
    } catch (error) {
      console.error("Error fetching trending movies", error);
    }
  };

  // Fetch movies by genre
  const fetchGenreMovies = async () => {
    let genreData = {};
    for (let genre of genres) {
      try {
        const response = await axios.get(`${API_BASE_URL}/genres/${genre}`);
        genreData[genre] = response.data;
      } catch (error) {
        console.error(`Error fetching ${genre} movies`, error);
      }
    }
    setGenreMovies(genreData);
  };

  // Fetch movies by franchise
  const fetchFranchiseMovies = async () => {
    let franchiseData = {};
    for (let franchise of franchises) {
      try {
        const response = await axios.get(`${API_BASE_URL}/franchises/${franchise}`);
        franchiseData[franchise] = response.data;
      } catch (error) {
        console.error(`Error fetching ${franchise} movies`, error);
      }
    }
    setFranchiseMovies(franchiseData);
  };

  // Fetch user's watchlist from Firebase
  const fetchWatchlist = async () => {
    try {
      // Replace with your Firebase API endpoint for watchlist
      const response = await axios.get(`http://localhost:5001/api/user/watchlist?uid=${user.uid}`);
      setWatchlist(response.data);
    } catch (error) {
      console.error("Error fetching watchlist", error);
    }
  };

  return (
    <div className="homepage">
      {/* Header */}
      <header className="homepage-header">
        <div className="homepage-title">
          <h1>Welcome to Streamverse</h1>
          <h3>{user?.email}</h3>
        </div>
        <button className="user-btn" onClick={logout}>Logout</button>
      </header>

      {/* Trending Movies */}
      <section className="movie-section">
        <h2>🔥 Trending Movies</h2>
        <div className="movie-grid">
          {trendingMovies.map(movie => (
            <div key={movie.id} className="movie-card">
              <img src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} alt={movie.title} />
              <p>{movie.title}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Movies by Genre */}
      {Object.keys(genreMovies).map(genre => (
        <section key={genre} className="movie-section">
          <h2>{genre} Movies</h2>
          <div className="movie-grid">
            {genreMovies[genre]?.map(movie => (
              <div key={movie.id} className="movie-card">
                <img src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} alt={movie.title} />
                <p>{movie.title}</p>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Movies by Franchise */}
      {Object.keys(franchiseMovies).map(franchise => (
        <section key={franchise} className="movie-section">
          <h2>{franchise} Franchise</h2>
          <div className="movie-grid">
            {franchiseMovies[franchise]?.map(movie => (
              <div key={movie.id} className="movie-card">
                <img src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} alt={movie.title} />
                <p>{movie.title}</p>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Watchlist */}
      {watchlist.length > 0 && (
        <section className="movie-section">
          <h2>Your Watchlist</h2>
          <div className="movie-grid">
            {watchlist.map(movie => (
              <div key={movie.id} className="movie-card">
                <img src={movie.poster} alt={movie.title} />
                <p>{movie.title}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Homepage;
