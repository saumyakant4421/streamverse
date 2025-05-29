import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { FaHeart, FaTheaterMasks, FaGhost } from "react-icons/fa";
import { MdMovie, MdOutlineBeachAccess, MdOutlineLocalMovies } from "react-icons/md";
import { GiPunchingBag, GiCrimeSceneTape, GiDramaMasks, GiMagicPortal } from "react-icons/gi";
import Navbar from "./Navbar.js";
import SearchBar from "../components/SearchBar";
import "../styles/homepage.scss";

const API_BASE_URL = "http://localhost:4001/api/movies"; // Backend API

const genres = [
  "Action", "Adventure", "Animation", "Comedy",
  "Crime", "Documentary", "Drama", "Fantasy",
  "Horror", "SciFi"
];

// Map genre to icon
const genreIcons = {
  "Action": <GiPunchingBag />,
  "Adventure": <MdOutlineBeachAccess />,
  "Animation": <MdMovie />,
  "Comedy": <FaTheaterMasks />,
  "Crime": <GiCrimeSceneTape />,
  "Documentary": <MdOutlineLocalMovies />,
  "Drama": <GiDramaMasks />,
  "Fantasy": <GiMagicPortal />,
  "Horror": <FaGhost />,
  "SciFi": <MdMovie />
};

const Homepage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [trendingMovies, setTrendingMovies] = useState([]);
  const [genreMovies, setGenreMovies] = useState({});
  const [franchiseMovies, setFranchiseMovies] = useState({});
  const [watchlist, setWatchlist] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState("Action");

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    fetchTrendingMovies();
    fetchGenreMovies();
    fetchWatchlist();
  }, [user, navigate]);

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

  // Fetch user's watchlist
  const fetchWatchlist = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/api/user/watchlist?uid=${user.uid}`);
      setWatchlist(response.data);
    } catch (error) {
      console.error("Error fetching watchlist", error);
    }
  };

  // Add to watchlist functionality
  const handleAddToWatchlist = async (movie) => {
    try {
      // Check if movie is already in watchlist
      const isInWatchlist = watchlist.some(item => item.id === movie.id);
      if (isInWatchlist) {
        console.log("Movie already in watchlist");
        return;
      }

      // Prepare movie data for watchlist
      const watchlistItem = {
        id: movie.id,
        title: movie.title,
        poster: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
        uid: user.uid
      };

      // Add to watchlist in database
      await axios.post(`http://localhost:5001/api/user/watchlist/add`, watchlistItem);

      // Update local watchlist state
      setWatchlist([...watchlist, watchlistItem]);

    } catch (error) {
      console.error("Error adding movie to watchlist", error);
    }
  };

  // Genre selection handler
  const handleGenreSelect = (genre) => {
    setSelectedGenre(genre);
  };

  // MovieCard Component with fixed hover effects
  const MovieCard = ({ movie, onAddToWatchlist }) => {
    return (
      <div className="movie-card">
        <div className="poster-container">
          <img
            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
            alt={movie.title}
          />
        </div>
        <p className="movie-title">{movie.title}</p>
        <div className="movie-hover-overlay">
          <div className="movie-overview">
            {movie.overview ?
              movie.overview :
              'No overview available'
            }
          </div>
          <div className="movie-actions">
            <button
              className="watch-btn"
              onClick={(e) => {
                e.stopPropagation();
                onAddToWatchlist(movie);
              }}
            >
              Watch Later
            </button>
            <button
              className="details-btn"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/movie/${movie.id}`);
              }}
            >
              Details
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="homepage">
      {/* Use the Navbar component */}
      <Navbar />

      <div className="content-container">
        {/* Left Section */}
        <div className="left-section">
          {/* Search Bar */}
          <SearchBar placeholder="Search movies..." />

          {/* Welcome Section */}
          <div className="welcome-section">
            <h2>Welcome</h2>
            <p>{user?.displayName || user?.email}</p>
          </div>

          {/* Watchlist */}
          <div className="watchlist-section">
            <h3>Your Watchlist</h3>
            {watchlist.length > 0 ? (
              <div className="watchlist-grid">
                {watchlist.map((movie) => (
                  <div
                    key={movie.id}
                    className="watchlist-card"
                    onClick={() => navigate(`/movie/${movie.id}`)}
                  >
                    <img src={movie.poster} alt={movie.title} />
                    <p>{movie.title}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-watchlist">Your watchlist is empty</p>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="right-section">
          {/* Genre Selection with header */}
          <div className="genre-container">
            <div className="genre-header">
              <h2>Trending in {selectedGenre}</h2>
            </div>
            <div className="genre-grid">
              {genres.map((genre) => (
                <button
                  key={genre}
                  className={`genre-tile ${selectedGenre === genre ? "active" : ""}`}
                  onClick={() => handleGenreSelect(genre)}
                >
                  <span className="genre-icon">{genreIcons[genre]}</span>
                  <span className="genre-text">{genre}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Movies by Selected Genre */}
          <div className="genre-movies">
            <h3>{selectedGenre} Movies</h3>
            <div className="movie-grid">
              {genreMovies[selectedGenre]?.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onAddToWatchlist={handleAddToWatchlist}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Homepage;