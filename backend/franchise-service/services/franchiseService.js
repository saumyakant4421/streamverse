
const axios = require('axios');
const { db } = require('../config/firebase');
require('dotenv').config();
const popularFranchises = require('../data/popularFranchises.json'); // Load custom franchises

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Helper function to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to remove cache for all franchises
const removeAllFranchiseCache = async () => {
  try {
    const snapshot = await db.collection('franchise_cache').get();
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log('All franchise cache removed');
  } catch (error) {
    console.error('Error removing all franchise cache', error);
  }
};

// Example usage: Remove cache for all franchises
removeAllFranchiseCache();

// Helper function to make API calls with retry logic
const makeApiCall = async (url, params, retryCount = 0) => {
  try {
    const response = await axios.get(url, { params });
    return response.data;
  } catch (error) {
    console.error(`API call failed (attempt ${retryCount + 1}/${MAX_RETRIES}):`, {
      url,
      params,
      status: error.response?.status,
      message: error.message,
    });
    if (retryCount < MAX_RETRIES - 1) {
      await delay(RETRY_DELAY * (retryCount + 1));
      return makeApiCall(url, params, retryCount + 1);
    }
    throw error;
  }
};

const searchFranchises = async (query) => {
  try {
    const cacheKey = `search_${query.toLowerCase().replace(/\s+/g, '_')}`;
    const cacheRef = db.collection('franchise_cache').doc(cacheKey);
    const cacheDoc = await cacheRef.get();
    if (cacheDoc.exists) {
      const cachedData = cacheDoc.data();
      if (cachedData.expires > Date.now()) {
        console.log(`Returning cached results for query: ${query}`);
        return cachedData.results;
      }
    }

    const data = await makeApiCall(`${TMDB_BASE_URL}/search/collection`, {
      api_key: TMDB_API_KEY,
      query,
      page: 1,
    });

    const results = data.results || [];
    await cacheRef.set({
      results,
      expires: Date.now() + CACHE_DURATION,
    });

    return results;
  } catch (error) {
    console.error('TMDB franchise search error:', error.message, {
      code: error.code,
      status: error.response?.status,
      data: error.response?.data,
    });
    return [];
  }
};

const getFranchiseDetails = async (franchiseId) => {
  try {
    // Check if franchiseId is a custom franchise (e.g., 'mcu', 'dceu')
    const customFranchise = popularFranchises.franchises.find(f => f.id === franchiseId);
    const isCustomFranchise = !!customFranchise;
    const collectionId = isCustomFranchise ? franchiseId : parseInt(franchiseId);

    // Validate collectionId for non-custom franchises
    if (!isCustomFranchise && (isNaN(collectionId) || collectionId <= 0)) {
      throw new Error('Invalid collection ID');
    }

    // Check cache
    const cacheRef = db.collection('franchise_cache').doc(`details_${franchiseId}`);
    const cacheDoc = await cacheRef.get();
    if (cacheDoc.exists) {
      const cachedData = cacheDoc.data();
      if (cachedData.expires > Date.now()) {
        console.log(`Returning cached details for franchiseId: ${franchiseId}`);
        return cachedData.results;
      }
    }

    let movies = [];
    let franchiseData = { name: '', overview: '', poster_path: null };

    if (isCustomFranchise) {
      // Handle custom franchise
      franchiseData = {
        id: customFranchise.id,
        name: customFranchise.name,
        overview: `A collection of movies from the ${customFranchise.name}.`, // Custom overview
        poster_path: null, // We'll fetch the poster from the first movie
      };

      // Fetch movie details for each movie ID in the custom franchise
      movies = await Promise.all(
        customFranchise.movies.map(async (movie) => {
          try {
            const movieData = await makeApiCall(`${TMDB_BASE_URL}/movie/${movie.id}`, {
              api_key: TMDB_API_KEY,
              append_to_response: 'credits',
            });
            const credits = movieData.credits || { cast: [], crew: [] };
            const directors = credits.crew
              .filter((c) => c.job === 'Director')
              .map((c) => ({
                id: c.id,
                name: c.name || 'Unknown Director',
                profile_path: c.profile_path || null,
              }));
            const cast = credits.cast.slice(0, 5).map((c) => ({
              id: c.id,
              name: c.name || 'Unknown Actor',
              profile_path: c.profile_path || null,
            }));
            return {
              id: movieData.id,
              title: movieData.title,
              release_date: movieData.release_date || 'Unknown',
              overview: movieData.overview || 'No overview available',
              poster_path: movieData.poster_path || null,
              cast,
              directors,
              revenue: movieData.revenue || 0,
              genre_ids: movieData.genre_ids || [],
            };
          } catch (error) {
            console.warn(`Failed to fetch details for movie ${movie.id}:`, error.message);
            return {
              id: movie.id,
              title: movie.title || 'Unknown Movie',
              release_date: 'Unknown',
              overview: 'No overview available',
              poster_path: null,
              cast: [],
              directors: [],
              revenue: 0,
              genre_ids: [],
            };
          }
        })
      );

      // Use the poster of the first movie as the franchise poster
      franchiseData.poster_path = movies[0]?.poster_path || null;
    } else {
      // Handle TMDB collection
      const collectionData = await makeApiCall(`${TMDB_BASE_URL}/collection/${collectionId}`, {
        api_key: TMDB_API_KEY,
      }).catch((error) => {
        if (error.response?.status === 404) {
          throw new Error(`Franchise with ID ${collectionId} not found`);
        } else if (error.response?.status === 429) {
          throw new Error('TMDB API rate limit exceeded. Please try again later.');
        }
        throw error;
      });

      franchiseData = collectionData;
      movies = collectionData.parts || [];
    }

    // Fetch movie details with credits for TMDB collections
    if (!isCustomFranchise) {
      movies = await Promise.all(
        movies.map(async (movie) => {
          try {
            const movieData = await makeApiCall(`${TMDB_BASE_URL}/movie/${movie.id}`, {
              api_key: TMDB_API_KEY,
              append_to_response: 'credits',
            });
            const credits = movieData.credits || { cast: [], crew: [] };
            const directors = credits.crew
              .filter((c) => c.job === 'Director')
              .map((c) => ({
                id: c.id,
                name: c.name || 'Unknown Director',
                profile_path: c.profile_path || null,
              }));
            const cast = credits.cast.slice(0, 5).map((c) => ({
              id: c.id,
              name: c.name || 'Unknown Actor',
              profile_path: c.profile_path || null,
            }));
            return {
              ...movie,
              cast,
              directors,
              revenue: movieData.revenue || 0,
              genre_ids: movieData.genre_ids || [],
            };
          } catch (error) {
            console.warn(`Failed to fetch details for movie ${movie.id}:`, error.message);
            return {
              ...movie,
              cast: [],
              directors: [],
              revenue: 0,
              genre_ids: [],
            };
          }
        })
      );
    }

    // Aggregate unique cast and directors by ID
    const totalCast = [
      ...new Map(
        movies
          .flatMap((m) => m.cast || [])
          .map((c) => [c.id, c])
      ).values(),
    ];
    const totalDirectors = [
      ...new Map(
        movies
          .flatMap((m) => m.directors || [])
          .map((d) => [d.id, d])
      ).values(),
    ];

    const totalBoxOffice = movies.reduce((sum, m) => sum + (m.revenue || 0), 0);

    const results = {
      id: franchiseData.id,
      name: franchiseData.name || 'Unknown Franchise',
      overview: franchiseData.overview || 'No overview available',
      poster_path: franchiseData.poster_path || null,
      movies,
      totalCast: Array.isArray(totalCast) ? totalCast : [],
      totalDirectors: Array.isArray(totalDirectors) ? totalDirectors : [],
      totalBoxOffice,
    };

    await cacheRef.set({
      results,
      expires: Date.now() + CACHE_DURATION,
    });

    return results;
  } catch (error) {
    console.error('TMDB franchise details error:', error.message, {
      code: error.code,
      status: error.response?.status,
      data: error.response?.data,
    });
    return null;
  }
};

module.exports = { searchFranchises, getFranchiseDetails };
