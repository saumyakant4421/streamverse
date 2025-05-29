import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/recommendpage.scss';
import { FiRefreshCw } from 'react-icons/fi';
import { getAuth } from 'firebase/auth';

const RECOMMENDATION_API_BASE_URL = 'http://localhost:4002/api/recommendations';
const USER_API_BASE_URL = 'http://localhost:5001/api/user';

const RecommendPage = () => {
  const [activeTab, setActiveTab] = useState('personalized');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user ? user.uid : null;

  const recommendationService = axios.create({
    baseURL: RECOMMENDATION_API_BASE_URL,
    headers: { 
      'Content-Type': 'application/json'
    },
    withCredentials: false
  });

  const userService = axios.create({
    baseURL: USER_API_BASE_URL,
    headers: { 
      'Content-Type': 'application/json'
    },
    withCredentials: false
  });

  const setupAuthToken = async () => {
    if (!user) {
      console.log('No user authenticated');
      setError('Please log in to get personalized recommendations');
      return false;
    }

    try {
      const auth = getAuth();
      const token = await auth.currentUser.getIdToken(true);
      if (!token) {
        throw new Error('Failed to retrieve ID token');
      }
      console.log('Setting auth token:', token.slice(0, 10) + '...');
      recommendationService.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      userService.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return true;
    } catch (error) {
      console.error('Error getting auth token:', error.message);
      setError('Authentication failed. Please log in again.');
      return false;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const tokenSet = await setupAuthToken();
      if (isMounted && tokenSet && activeTab === 'personalized' && userId) {
        fetchPersonalizedRecommendations();
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, [user, activeTab, userId]);

  const fetchPersonalizedRecommendations = async () => {
    if (!userId) {
      setError('Please log in to get personalized recommendations');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tokenSet = await setupAuthToken();
      if (!tokenSet) {
        throw new Error('Token setup failed');
      }
      const response = await recommendationService.post('/personalized', { userId });
      const recs = Array.isArray(response.data) ? response.data : [];
      const genres = recs.flatMap(movie => movie.genres || []);
      console.log('Recommendations for user', userId, ':', recs);
      console.log('Genre distribution:', Object.entries(genres.reduce((acc, g) => {
        acc[g] = (acc[g] || 0) + 1;
        return acc;
      }, {})).map(([g, c]) => `${g}: ${c}`));
      setRecommendations(recs);
    } catch (error) {
      console.error('Error fetching personalized recommendations:', error.message);
      setError(`Failed to fetch recommendations: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchPersonalizedRecommendations();
  };

  const handleMovieClick = (movieId) => {
    navigate(`/movie/${movieId}`);
  };

  const getPosterUrl = (poster_path) => {
    if (!poster_path) return null;
    if (poster_path.startsWith('http')) {
      return poster_path;
    }
    return `https://image.tmdb.org/t/p/w500${poster_path}`;
  };

  return (
    <div className="recommendation-page">
      <div className="recommendation-container">
        <div className="header-container">
          <button
            className="back-to-home-btn"
            onClick={() => navigate('/')}
            title="Back to Home"
          >
            <span className="arrow-icon">←</span>
            Back to Home
          </button>
          <div className="title-wrapper">
            <h1>MovieAI Recommendations</h1>
          </div>
        </div>
        
        <div className="tabs">
          <button
            className={activeTab === 'personalized' ? 'active' : ''}
            onClick={() => setActiveTab('personalized')}
          >
            Personalized
          </button>
          <button
            className={activeTab === 'chat' ? 'active' : ''}
            onClick={() => setActiveTab('chat')}
          >
            Chat Model
          </button>
        </div>

        {activeTab === 'personalized' && (
          <div className="personalized-container">
            <div className="header">
              <h2>Your Personalized Picks</h2>
              <FiRefreshCw
                className={`refresh-icon ${loading ? 'spinning' : ''}`}
                onClick={handleRefresh}
                title="Refresh Recommendations"
              />
            </div>
            {loading && (
              <div className="loading">
                <div className="spinner"></div>
                <span>Fetching your recommendations... (may take up to 10 minutes)</span>
              </div>
            )}
            {error && <div className="error-message">{error}</div>}
            {!loading && recommendations.length > 0 && (
              <div className="recommendations-grid">
                {recommendations.map(movie => (
                  <div
                    key={movie.id}
                    className="movie-card"
                    onClick={() => handleMovieClick(movie.id)}
                  >
                    <div className="movie-poster">
                      {movie.poster_path ? (
                        <img
                          src={getPosterUrl(movie.poster_path)}
                          alt={movie.title}
                          onError={(e) => {
                            console.error(`Failed to load poster for ${movie.title}`);
                            e.target.onerror = null;
                            e.target.src = 'https://dummyimage.com/500x750/ccc/fff.png&text=No+Poster';
                          }}
                        />
                      ) : (
                        <div className="no-poster">No Poster</div>
                      )}
                      <div className="movie-overlay">
                        <div className="movie-meta">
                          <span className="rating">★ {movie.vote_average?.toFixed(1) || 'N/A'}</span>
                          <span className="genres">{movie.genres?.join(', ') || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="movie-info">
                      <h3>{movie.title}</h3>
                      <span className="year">{movie.release_date?.substring(0, 4) || 'N/A'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!loading && recommendations.length === 0 && !error && (
              <div className="empty-state">
                No recommendations yet. Click the refresh icon to get started!
              </div>
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="chat-container">
            <h2>Chat Model</h2>
            <div className="placeholder">
              Coming Soon! AI-powered chat recommendations are under development.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendPage;