const { getPersonalizedRecommendations } = require('../services/recommendationService');
const logger = require('../utils/logger');

const getPersonalizedRecommendationsController = async (req, res) => {
  try {
    logger.info(`getPersonalizedRecommendations request: ${JSON.stringify({
      userId: req.body?.userId,
      authHeader: req.headers.authorization
    })}`);
    await getPersonalizedRecommendations(req, res);
  } catch (error) {
    logger.error(`Controller Error in getPersonalizedRecommendations: ${error.message}`);
    res.status(500).json({ error: `Failed to fetch recommendations: ${error.message}` });
  }
};

module.exports = { getPersonalizedRecommendationsController };