const express = require('express');
const cors = require('cors');
const { getPersonalizedRecommendations } = require('./services/recommendationService');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 4002;

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control'],
  credentials: false
}));

// Middleware
app.use(express.json());

// Routes
app.post('/api/recommendations/personalized', getPersonalizedRecommendations);

// Error handling
app.use((err, req, res, next) => {
  logger.error(`Server error: ${err.message}`);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Recommendation service running on port ${PORT}`);
});