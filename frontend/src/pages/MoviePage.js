import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from "./Navbar.js"; 
import axios from 'axios';
import "../styles/moviepage.scss";

// Streaming service icons - Import your SVG icons here
import NetflixIcon from '../assets/icons/netflix_2504929.png';
import AmazonIcon from '../assets/icons/icons8-amazon-prime-video.svg';
import DisneyIcon from '../assets/icons/icons8-disney-plus.svg';
import AppleTVIcon from '../assets/icons/icons8-apple-tv.svg';
import ParamountIcon from '../assets/icons/icons8-paramount-plus.svg';
import PeacockIcon from '../assets/icons/download.svg';
import HuluIcon from '../assets/icons/icons8-hulu.svg';

const MovieDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [similarMovies, setSimilarMovies] = useState([]);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isWatched, setIsWatched] = useState(false);
  
  // Retrieve auth data from localStorage
  const authToken = localStorage.getItem('authToken');
  const userId = localStorage.getItem('userId');

  // Create axios instances for different services
  const movieService = axios.create({
    baseURL: 'http://localhost:4001/api',
    headers: { Authorization: authToken }
  });

  const userService = axios.create({
    baseURL: 'http://localhost:5001/api/users',
    headers: { Authorization: authToken }
  });

  // Mock data for streaming services availability
  // In a real app, this would come from your backend
  const streamingServices = {
    netflix: { available: Math.random() > 0.5, url: 'https://netflix.com/title/12345' },
    amazonPrime: { available: Math.random() > 0.5, url: 'https://primevideo.com/detail/12345' },
    disneyPlus: { available: Math.random() > 0.5, url: 'https://disneyplus.com/movies/12345' },
    appleTv: { available: Math.random() > 0.5, url: 'https://tv.apple.com/movie/12345' },
    paramount: { available: Math.random() > 0.5, url: 'https://paramountplus.com/movies/12345' },
    peacock: { available: Math.random() > 0.5, url: 'https://peacocktv.com/watch/asset/12345' },
    hulu: { available: Math.random() > 0.5, url: 'https://hulu.com/movie/12345' },
  };

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        setLoading(true);
        const response = await movieService.get(`/movies/${id}`);
        setMovie(response.data);
        
        // Fetch similar movies
        try {
          const similarResponse = await movieService.get(`/movies/${id}/similar`);
          setSimilarMovies(similarResponse.data || []);
        } catch (error) {
          console.error("Error fetching similar movies:", error);
          setSimilarMovies([]);
        }
        
        // Only check watchlist and watched status if user is logged in
        if (userId && authToken) {
          checkWatchlistAndWatchedStatus();
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching movie details:', error);
        setLoading(false);
      }
    };

    fetchMovieDetails();
  }, [id]);

  const checkWatchlistAndWatchedStatus = async () => {
    try {
      // Get user's watchlist
      const watchlistResponse = await userService.get(`/watchlist`, {
        params: { uid: userId }
      });
      
      // Check if movie is in watchlist
      const inWatchlist = watchlistResponse.data.some(item => item.id === Number(id));
      setIsInWatchlist(inWatchlist);
      
      // Get user's watched list
      const watchedResponse = await userService.get(`/watched`, {
        params: { uid: userId }
      });
      
      // Check if movie is in watched list
      const inWatched = watchedResponse.data.some(item => item.id === Number(id));
      setIsWatched(inWatched);
    } catch (error) {
      console.error('Error checking watchlist/watched status:', error);
    }
  };

  const handleAddToWatchlist = async () => {
    // Check if user is logged in
    if (!userId || !authToken) {
      alert('Please log in to add movies to your watchlist');
      navigate('/login');
      return;
    }
    
    try {
      if (isInWatchlist) {
        // Remove from watchlist
        await userService.delete(`/watchlist/remove`, {
          params: { uid: userId, movieId: movie.id }
        });
        
        console.log("Successfully removed from watchlist");
        setIsInWatchlist(false);
      } else {
        // Add to watchlist
        await userService.post(`/watchlist/add`, {
          uid: userId,
          id: movie.id,
          title: movie.title,
          poster: movie.poster_path
        });
        
        console.log("Successfully added to watchlist");
        setIsInWatchlist(true);
      }
    } catch (error) {
      console.error('Error updating watchlist:', error);
      alert(`Failed to update watchlist: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleAddToWatched = async () => {
    // Check if user is logged in
    if (!userId || !authToken) {
      alert('Please log in to mark movies as watched');
      navigate('/login');
      return;
    }
    
    try {
      if (isWatched) {
        // Remove from watched list
        await userService.delete(`/watched/remove`, {
          params: { uid: userId, movieId: movie.id }
        });
        
        console.log("Successfully removed from watched list");
        setIsWatched(false);
      } else {
        // Add to watched list
        await userService.post(`/watched/add`, {
          uid: userId,
          movie: {
            id: movie.id,
            title: movie.title,
            poster: movie.poster_path
          }
        });
        
        console.log("Successfully added to watched list");
        setIsWatched(true);
      }
    } catch (error) {
      console.error('Error updating watched list:', error);
      alert(`Failed to update watched list: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleStreamingServiceClick = (url) => {
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="loading-container">
          <div className="loader"></div>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div>
        <Navbar />
        <div className="error-container">
          <h2>Movie not found</h2>
          <button onClick={() => navigate('/')}>Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="movie-detail-page">
      <Navbar />
      
      <div className="movie-backdrop" style={{ backgroundImage: `url(https://image.tmdb.org/t/p/original${movie.backdrop_path})` }}>
        <div className="backdrop-overlay"></div>
      </div>
      
      <div className="movie-content">
        <div className="movie-poster-container">
          <img 
            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
            alt={movie.title} 
            className="movie-poster" 
          />
        </div>
        
        <div className="movie-info">
          <h1 className="movie-title">{movie.title}</h1>
          <div className="movie-meta">
            <span className="movie-year">{movie.release_date ? movie.release_date.substring(0, 4) : 'N/A'}</span>
            <span className="movie-runtime">{movie.runtime} min</span>
            <span className="movie-rating">⭐ {movie.vote_average.toFixed(1)}</span>
          </div>
          
          <div className="movie-genres">
            {movie.genres && movie.genres.map(genre => (
              <span key={genre.id} className="genre-tag">{genre.name}</span>
            ))}
          </div>
          
          <div className="movie-overview">
            <h3>Overview</h3>
            <p>{movie.overview}</p>
          </div>
          
          <div className="movie-actions">
            <button 
              className={`watchlist-btn ${isInWatchlist ? 'active' : ''}`}
              onClick={handleAddToWatchlist}
            >
              {isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
            </button>
            
            <button 
              className={`watched-btn ${isWatched ? 'active' : ''}`}
              onClick={handleAddToWatched}
            >
              {isWatched ? 'Remove from Watched' : 'Mark as Watched'}
            </button>
          </div>
          
          <div className="streaming-options">
            <h3>Watch Options</h3>
            <div className="streaming-icons">
              <div 
                className={`streaming-icon ${streamingServices.netflix.available ? 'available' : ''}`}
                onClick={() => streamingServices.netflix.available && handleStreamingServiceClick(streamingServices.netflix.url)}
              >
                <img src={NetflixIcon} alt="Netflix" />
                <span>Netflix</span>
              </div>
              
              <div 
                className={`streaming-icon ${streamingServices.amazonPrime.available ? 'available' : ''}`}
                onClick={() => streamingServices.amazonPrime.available && handleStreamingServiceClick(streamingServices.amazonPrime.url)}
              >
                <img src={AmazonIcon} alt="Amazon Prime" />
                <span>Prime</span>
              </div>
              
              <div 
                className={`streaming-icon ${streamingServices.disneyPlus.available ? 'available' : ''}`}
                onClick={() => streamingServices.disneyPlus.available && handleStreamingServiceClick(streamingServices.disneyPlus.url)}
              >
                <img src={DisneyIcon} alt="Disney+" />
                <span>Disney+</span>
              </div>
              
              <div 
                className={`streaming-icon ${streamingServices.appleTv.available ? 'available' : ''}`}
                onClick={() => streamingServices.appleTv.available && handleStreamingServiceClick(streamingServices.appleTv.url)}
              >
                <img src={AppleTVIcon} alt="Apple TV" />
                <span>Apple TV</span>
              </div>
              
              <div 
                className={`streaming-icon ${streamingServices.paramount.available ? 'available' : ''}`}
                onClick={() => streamingServices.paramount.available && handleStreamingServiceClick(streamingServices.paramount.url)}
              >
                <img src={ParamountIcon} alt="Paramount+" />
                <span>Paramount+</span>
              </div>
              
              <div 
                className={`streaming-icon ${streamingServices.peacock.available ? 'available' : ''}`}
                onClick={() => streamingServices.peacock.available && handleStreamingServiceClick(streamingServices.peacock.url)}
              >
                <img src={PeacockIcon} alt="Peacock" />
                <span>Peacock</span>
              </div>
              
              <div 
                className={`streaming-icon ${streamingServices.hulu.available ? 'available' : ''}`}
                onClick={() => streamingServices.hulu.available && handleStreamingServiceClick(streamingServices.hulu.url)}
              >
                <img src={HuluIcon} alt="Hulu" />
                <span>Hulu</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {similarMovies.length > 0 && (
        <div className="similar-movies-section">
          <h2>Similar Movies</h2>
          <div className="similar-movies">
            {similarMovies.slice(0, 6).map(movie => (
              <div key={movie.id} className="similar-movie-card" onClick={() => navigate(`/movie/${movie.id}`)}>
                <img 
                  src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`} 
                  alt={movie.title} 
                />
                <div className="similar-movie-title">{movie.title}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieDetailPage;