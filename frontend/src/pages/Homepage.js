import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { FaUser, FaSearch, FaHeart, FaTheaterMasks, FaGhost } from "react-icons/fa";
import { MdMovie, MdOutlineBeachAccess, MdOutlineLocalMovies } from "react-icons/md";
import { GiPunchingBag, GiCrimeSceneTape, GiDramaMasks, GiMagicPortal } from "react-icons/gi";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

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

  // Properly implemented debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    setIsSearchLoading(true);
    setShowSearchResults(true);
    
    const source = axios.CancelToken.source(); // Create cancel token

    const searchMovies = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/search`, {
          params: { query: searchQuery },
          cancelToken: source.token, // Attach cancel token
        });
        setSearchResults(response.data || []);
      } catch (error) {
        if (axios.isCancel(error)) {
          console.log("Previous request canceled");
        } else {
          console.error("Error searching movies", error);
          setSearchResults([]);
        }
      } finally {
        setIsSearchLoading(false);
      }
    };

    const timeoutId = setTimeout(searchMovies, 500);
    return () => {
      clearTimeout(timeoutId);
      source.cancel(); 
    };
  }, [searchQuery]);

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

  // Handle search input blur to hide results when clicking outside
  const handleSearchBlur = (e) => {
    // Small delay to allow click events on search results to register
    setTimeout(() => {
      setShowSearchResults(false);
    }, 200);
  };

  // Handle search input focus to show results again if query exists
  const handleSearchFocus = () => {
    if (searchQuery.trim() !== '') {
      setShowSearchResults(true);
    }
  };

  // Close search results
  const handleCloseSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
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

  // Search Result Card - modified to show Details instead of Watch
  const SearchResultCard = ({ movie }) => {
    return (
      <div 
        className="search-result-item"
        onClick={() => navigate(`/movie/${movie.id}`)}
      >
        <div className="search-result-poster">
          {movie.poster_path ? (
            <img
              src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
              alt={movie.title}
            />
          ) : (
            <div className="no-poster">No Image</div>
          )}
        </div>
        <div className="search-result-details">
          <h4>{movie.title}</h4>
          <p>{movie.release_date ? new Date(movie.release_date).getFullYear() : 'Unknown'}</p>
          <div className="search-result-actions">
            <button 
              className="search-watch-btn"
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
      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">Streamverse</div>
        <div className="nav-links">
          <Link to="/" className="active">Home</Link>
          <Link to="/franchises">Explore Franchises</Link>
          <Link to="/tools">Tools</Link>
        </div>
        <div className="profile-icon" onClick={() => navigate("/user")}>
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
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              className="search-input"
            />
            <FaSearch className="search-icon" />
            
            {searchQuery && (
              <button 
                className="clear-search-btn"
                onClick={handleCloseSearch}
              >
                ×
              </button>
            )}

            {isSearchLoading && <div className="loading-spinner">Loading...</div>}

            {showSearchResults && searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map(movie => (
                  <SearchResultCard 
                    key={movie.id} 
                    movie={movie}
                  />
                ))}
              </div>
            )}
            
            {showSearchResults && searchQuery && !isSearchLoading && searchResults.length === 0 && (
              <div className="search-results">
                <div className="no-results">No movies found matching "{searchQuery}"</div>
              </div>
            )}
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