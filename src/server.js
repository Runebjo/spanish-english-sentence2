const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const searchRoutes = require('./routes/search');
const { initializeIndex, indexSentences } = require('./services/elasticsearch');

const app = express();
const port = 3000;

app.use(express.json());

app.use('/api', searchRoutes);

async function loadAndIndexData() {
  try {
    console.log('Initializing Elasticsearch index...');
    await initializeIndex();
    console.log('Index initialized. Loading data...');
    const data = await fs.readFile(
      path.join(__dirname, '../data/sentences.json'),
      'utf8'
    );
    const sentences = JSON.parse(data).translations;
    console.log(`Loaded ${sentences.length} sentences. Indexing data...`);
    await indexSentences(sentences);
    console.log('Data indexed successfully');
  } catch (error) {
    console.error('Error loading and indexing data:', error);
    process.exit(1); // Exit the process if we can't load or index the data
  }
}

async function startServer() {
  try {
    await loadAndIndexData();
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
