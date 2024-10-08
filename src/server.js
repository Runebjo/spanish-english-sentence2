const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const searchRoutes = require('./routes/search');
const {
  initializeIndex,
  indexSentences,
  getDocumentCount,
} = require('./services/elasticsearch');

const app = express();
const port = 3000;

app.use(express.json());

app.use('/api', searchRoutes);

async function loadAndIndexData() {
  try {
    console.log('Initializing Elasticsearch index...');
    await initializeIndex();

    console.log('Checking if index is empty...');
    const documentCount = await getDocumentCount();

    if (documentCount === 0) {
      console.log('Index is empty. Loading and indexing data...');
      const dataDir = path.join(__dirname, '../data');
      const files = await fs.readdir(dataDir);
      const jsonFiles = files.filter(
        (file) => path.extname(file).toLowerCase() === '.json'
      );

      let allSentences = [];

      for (const file of jsonFiles) {
        const filePath = path.join(dataDir, file);
        const data = await fs.readFile(filePath, 'utf8');
        const fileContent = JSON.parse(data);

        if (Array.isArray(fileContent)) {
          allSentences = allSentences.concat(fileContent);
        } else {
          console.warn(
            `File ${file} does not contain an array of sentences. Skipping.`
          );
        }
      }

      console.log(
        `Loaded ${allSentences.length} sentences from ${jsonFiles.length} files. Indexing data...`
      );
      await indexSentences(allSentences);
      console.log('Data indexed successfully');
    } else {
      console.log(
        `Index already contains ${documentCount} documents. Skipping indexing.`
      );
    }
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
