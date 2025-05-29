
const { searchFranchises, getFranchiseDetails } = require('../services/franchiseService');

// Handler for searching franchises by query
const searchFranchisesHandler = async (req, res) => {
  const { query } = req.query;

  // Validate query parameter
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({ 
      error: 'Invalid search query', 
      details: 'Search query is required and must be a non-empty string' 
    });
  }

  try {
    const franchises = await searchFranchises(query.trim());
    if (!franchises) {
      return res.status(404).json({ 
        error: 'No franchises found', 
        details: `No franchises matched the query: ${query}` 
      });
    }
    res.status(200).json(franchises);
  } catch (error) {
    console.error('Controller Error in searchFranchisesHandler:', {
      message: error.message,
      stack: error.stack,
      query
    });

    const status = error.message.includes('not found') ? 404 : 500;
    const details = error.message.includes('ECONNRESET')
      ? 'Network error connecting to TMDB API. Please try again later.'
      : error.message.includes('rate limit')
      ? 'TMDB API rate limit exceeded. Please try again later.'
      : error.message;

    res.status(status).json({ 
      error: 'Failed to search franchises', 
      details 
    });
  }
};

// Handler for fetching franchise details by franchise ID (custom or TMDB collection ID)
const getFranchiseDetailsHandler = async (req, res) => {
  const { collectionId } = req.params;

  // Validate franchiseId (allow strings for custom franchises)
  if (!collectionId || typeof collectionId !== 'string' || collectionId.trim().length === 0) {
    return res.status(400).json({ 
      error: 'Invalid franchise ID', 
      details: 'Franchise ID must be a non-empty string' 
    });
  }

  try {
    const details = await getFranchiseDetails(collectionId);
    if (!details) {
      return res.status(404).json({ 
        error: 'Franchise not found', 
        details: `No franchise found for ID: ${collectionId}` 
      });
    }

    // Validate expected structure
    if (!details.totalCast || !details.totalDirectors) {
      console.warn('Incomplete franchise data:', { collectionId, details });
      return res.status(500).json({ 
        error: 'Incomplete franchise data', 
        details: 'Franchise data is missing cast or director information' 
      });
    }

    res.status(200).json(details);
  } catch (error) {
    console.error('Controller Error in getFranchiseDetailsHandler:', {
      message: error.message,
      stack: error.stack,
      collectionId
    });

    const status = error.message.includes('not found') ? 404 : 500;
    const details = error.message.includes('ECONNRESET')
      ? 'Network error connecting to TMDB API. Please try again later.'
      : error.message.includes('rate limit')
      ? 'TMDB API rate limit exceeded. Please try again later.'
      : error.message.includes('Invalid collection ID')
      ? 'Invalid franchise ID provided'
      : error.message;

    res.status(status).json({ 
      error: 'Failed to fetch franchise details', 
      details 
    });
  }
};

module.exports = { searchFranchisesHandler, getFranchiseDetailsHandler };
