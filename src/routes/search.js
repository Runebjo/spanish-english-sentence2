const express = require('express');
const router = express.Router();
const { searchSentences } = require('../services/elasticsearch');

router.get('/search', async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    const results = await searchSentences(query);
    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'An error occurred while searching' });
  }
});

module.exports = router;
