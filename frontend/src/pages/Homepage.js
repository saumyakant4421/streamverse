import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { FaUser, FaSearch, FaHeart, FaTheaterMasks, FaGhost } from "react-icons/fa";
import { MdMovie, MdOutlineBeachAccess, MdOutlineLocalMovies, MdFilterList, MdSort } from "react-icons/md";
import { GiPunchingBag, GiCrimeSceneTape, GiDramaMasks, GiMagicPortal } from "react-icons/gi";
import "../styles/homepage.scss";
import logo from "../assets/logo.png";

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
  const [selectedGenre, setSelectedGenre] = useState("Action");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login"); // Redirect to login if not authenticated
      return;
    }

    fetchTrendingMovies();
    fetchGenreMovies();
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

  const handleGenreSelect = (genre) => {
    setSelectedGenre(genre);
  };

  return (
    <div className="homepage">
      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">Streamverse</div>
        <div className="nav-links">
          <Link to="/" className="active">Home</Link>
          <Link to="/franchises">Explore Franchises</Link>
          <Link to="/tools">Tools </Link>
          </div>
        <div className="profile-icon" onClick={() => navigate("/profile")}>
          <FaUser />
        </div>
      </nav>

      <div className="content-container">
        {/* Left Section */}
        <div className="left-section">
          {/* Search Bar */}
          <div className="search-container">
            <input
              type="text"
              placeholder="Search movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <FaSearch className="search-icon" />
          </div>

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
                  <div key={movie.id} className="watchlist-card">
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
          {/* Genre Selection with header and filter/sort buttons */}
          <div className="genre-container">
            <div className="genre-header">
              <h2>Trending in Animation</h2>
              <div className="genre-actions">
                <button className="filter-button">
                  <MdFilterList />
                </button>
                <button className="sort-button">
                  <MdSort />
                </button>
              </div>
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
                <div key={movie.id} className="movie-card">
                  <img
                    src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                    alt={movie.title}
                  />
                  <p>{movie.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Homepage;