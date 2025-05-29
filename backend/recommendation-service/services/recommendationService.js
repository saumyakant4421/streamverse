require('dotenv').config();
const axios = require('axios');
const admin = require('firebase-admin');
const logger = require('../utils/logger');
const { getUserMovies } = require('./userService');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID
  });
}

const RECOMMENDER_API_URL = 'http://localhost:8000/recommend';
const TMDB_API_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY || 'your_tmdb_api_key';
const FALLBACK_POSTER_URL = 'https://dummyimage.com/500x750/ccc/fff.png&text=No+Poster';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const makeApiCall = async (url, params, headers = {}, retryCount = 0) => {
  try {
    const response = await axios.get(url, { params, headers });
    return response.data;
  } catch (error) {
    logger.error(`API call failed (attempt ${retryCount + 1}/${MAX_RETRIES}):`, {
      url,
      params,
      status: error.response?.status,
      message: error.message
    });

    if (retryCount < MAX_RETRIES - 1) {
      await delay(RETRY_DELAY * (retryCount + 1));
      return makeApiCall(url, params, headers, retryCount + 1);
    }

    throw error;
  }
};

const fetchTmdbMovie = async (title, tmdbId) => {
  try {
    if (!TMDB_API_KEY) {
      logger.error('TMDB_API_KEY is not defined in .env');
      return null;
    }
    const response = await makeApiCall(
      `${TMDB_API_URL}/movie/${tmdbId}`,
      { api_key: TMDB_API_KEY },
      { 'Accept': 'application/json' }
    );
    logger.info(`TMDb response for ${title} (ID: ${tmdbId}): ${JSON.stringify({ id: response.id, release_date: response.release_date })}`);
    return response;
  } catch (error) {
    logger.error(`Error fetching TMDb data for ${title} (ID: ${tmdbId}): ${error.message}`);
    return null;
  }
};

const fetchPoster = async (title, year = '') => {
  try {
    const params = {
      apikey: process.env.OMDB_API_KEY,
      t: title,
      y: year || undefined
    };
    const data = await makeApiCall('http://www.omdbapi.com/', params);
    logger.info(`OMDb response for ${title} (${year}): ${JSON.stringify(data)}`);

    if (data.Response === 'False') {
      logger.warn(`OMDb API returned no poster for ${title} (${year}): ${data.Error}`);
      return FALLBACK_POSTER_URL;
    }

    return data.Poster && data.Poster !== 'N/A' ? data.Poster : FALLBACK_POSTER_URL;
  } catch (error) {
    logger.error(`Error in fetchPoster for ${title} (${year}): ${error.message}`);
    return FALLBACK_POSTER_URL;
  }
};

const getPersonalizedRecommendations = async (req, res) => {
  let userId = null;
  try {
    logger.info(`Received request: ${JSON.stringify({ body: req.body, headers: req.headers })}`);
    const body = req.body || {};
    userId = body.userId;
    const token = req.headers.authorization?.split('Bearer ')[1];

    if (!userId || !token) {
      logger.error(`Missing userId or token: userId=${userId || 'missing'}, token=${token ? 'present' : 'missing'}`);
      return res.status(400).json({ error: 'User ID and token are required' });
    }

    const { watchlist, watchedMovies } = await getUserMovies(userId, token);
    const watchlistMovies = await Promise.all(watchlist.map(async item => {
      let year;
      if (item.release_date) {
        year = new Date(item.release_date).getFullYear();
      } else if (item.year) {
        year = item.year;
      } else {
        const tmdbData = await fetchTmdbMovie(item.title, item.id);
        year = tmdbData?.release_date ? new Date(tmdbData.release_date).getFullYear() : undefined;
      }
      return {
        title: item.title,
        year: year,
        tmdbId: item.id
      };
    }));
    const watchedMoviesFormatted = watchedMovies.map(item => ({
      title: item.title,
      rating: item.rating || 4.0, // Default rating if not provided
      year: item.release_date ? new Date(item.release_date).getFullYear() : item.year
    }));
    logger.info(`Sending watchlist and watched movies to FastAPI for user ${userId}: watchlist=${JSON.stringify(watchlistMovies)}, watched=${JSON.stringify(watchedMoviesFormatted)}`);

    const response = await axios.post(RECOMMENDER_API_URL, {
      user_id: userId,
      watchlist_movies: watchlistMovies.map(({ title, year }) => ({ title, year })),
      watched_movies: watchedMoviesFormatted,
      top_n: 15,
      sample_ratings: true
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    let recommendations = response.data.recommendations || [];
    const genres = recommendations.flatMap(rec => rec.genres || []);
    logger.info(`FastAPI recommendations for user ${userId}: ${JSON.stringify(recommendations.slice(0, 2))}... Genre distribution: ${JSON.stringify(Object.fromEntries(Object.entries(genres.reduce((acc, g) => {
      acc[g] = (acc[g] || 0) + 1;
      return acc;
    }, {})).sort((a, b) => b[1] - a[1])))}`);

    if (recommendations.length === 0) {
      logger.warn(`No recommendations returned for user ${userId}, falling back to generic`);
      recommendations = await getGenericRecommendations();
    }

    const enrichedRecommendations = await Promise.all(recommendations.map(async (rec) => {
      const poster_path = await fetchPoster(rec.title, rec.release_date ? rec.release_date.split('-')[0] : '');
      return { ...rec, poster_path };
    }));

    res.json(enrichedRecommendations);
  } catch (error) {
    logger.error(`Error generating recommendations for user ${userId || 'unknown'}: ${error.message}`);
    res.status(500).json({ error: `Failed to generate recommendations: ${error.message}` });
  }
};

const getGenericRecommendations = async () => {
  try {
    const response = await axios.post(RECOMMENDER_API_URL, {
      user_id: null,
      watchlist_movies: [],
      watched_movies: [],
      top_n: 15,
      sample_ratings: true
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data.recommendations || [];
  } catch (error) {
    logger.error(`Error fetching generic recommendations: ${error.message}`);
    return [];
  }
};

module.exports = { getPersonalizedRecommendations };