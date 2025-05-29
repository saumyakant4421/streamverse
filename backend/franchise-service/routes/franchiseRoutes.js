// routes/franchiseRoutes.js
const express = require('express');
const { searchFranchisesHandler, getFranchiseDetailsHandler } = require('../controllers/franchiseController');

const router = express.Router();

router.get('/search', searchFranchisesHandler);
router.get('/:collectionId', getFranchiseDetailsHandler);

module.exports = router;