const axios = require('axios');
const NodeCache = require('node-cache');

const userCache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

const userService = axios.create({
  baseURL: 'http://localhost:5001/api/user',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

const getUserMovies = async (userId, token, retries = 1) => {
  const cacheKey = `userMovies_${userId}`;
  const cachedData = userCache.get(cacheKey);
  if (cachedData) {
    console.log(`Returning cached user movies for UID: ${userId}`);
    return cachedData;
  }

  try {
    console.log(`Fetching user movies for UID: ${userId} from http://localhost:5001/api/user`);
    userService.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    const [watchlistResponse, watchedResponse] = await Promise.all([
      userService.get('/watchlist', { params: { uid: userId } }),
      userService.get('/watched', { params: { uid: userId } })
    ]);

    console.log('Watchlist response:', JSON.stringify(watchlistResponse.data, null, 2));
    console.log('Watched response:', JSON.stringify(watchedResponse.data, null, 2));

    const result = {
      watchlist: Array.isArray(watchlistResponse.data) ? watchlistResponse.data : [],
      watchedMovies: Array.isArray(watchedResponse.data) ? watchedResponse.data : []
    };

    userCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error fetching user movies:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url
    });

    if (retries > 0) {
      console.log(`Retrying user movies fetch for UID: ${userId}, retries left: ${retries}`);
      return getUserMovies(userId, token, retries - 1);
    }

    return { watchlist: [], watchedMovies: [] };
  }
};

module.exports = { getUserMovies };