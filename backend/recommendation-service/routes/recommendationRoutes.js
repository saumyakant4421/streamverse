const express = require('express');
const router = express.Router();
const { getPersonalizedRecommendationsController } = require('../controllers/recommendationController');

router.post('/personalized', getPersonalizedRecommendationsController);

module.exports = router;