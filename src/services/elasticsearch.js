const { Client } = require('@elastic/elasticsearch');

const MAX_RETRIES = 5;
const RETRY_INTERVAL = 5000; // 5 seconds

async function createClient() {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const client = new Client({
        node: `http://${process.env.ELASTICSEARCH_HOST}:${process.env.ELASTICSEARCH_PORT}`,
      });
      await client.ping();
      console.log('Successfully connected to Elasticsearch');
      return client;
    } catch (error) {
      console.log(
        `Attempt ${i + 1} failed. Retrying in ${
          RETRY_INTERVAL / 1000
        } seconds...`
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL));
    }
  }
  throw new Error('Failed to connect to Elasticsearch after multiple attempts');
}

let client;

const INDEX_NAME = 'sentences';

async function initializeIndex() {
  try {
    if (!client) {
      client = await createClient();
    }
    const indexExists = await client.indices.exists({ index: INDEX_NAME });
    if (!indexExists.body) {
      await client.indices.create({
        index: INDEX_NAME,
        body: {
          mappings: {
            properties: {
              spanish: { type: 'text', analyzer: 'spanish' },
              english: { type: 'text', analyzer: 'english' },
            },
          },
        },
      });
      console.log(`Index ${INDEX_NAME} created.`);
    } else {
      console.log(`Index ${INDEX_NAME} already exists.`);
    }
  } catch (error) {
    console.error('Error initializing index:', error);
    throw error;
  }
}

async function indexSentences(sentences) {
  try {
    if (!client) {
      client = await createClient();
    }
    const body = sentences.flatMap((sentence) => [
      { index: { _index: INDEX_NAME } },
      sentence,
    ]);

    const bulkResponse = await client.bulk({ refresh: true, body });

    if (bulkResponse.errors) {
      console.error('Bulk indexing errors:', bulkResponse.errors);
    } else {
      console.log(`Indexed ${sentences.length} sentences.`);
    }
  } catch (error) {
    console.error('Error indexing sentences:', error);
    throw error;
  }
}

async function searchSentences(query) {
  try {
    if (!client) {
      client = await createClient();
    }
    const { body } = await client.search({
      index: INDEX_NAME,
      body: {
        query: {
          multi_match: {
            query: query,
            fields: ['spanish', 'english'],
          },
        },
      },
    });

    return body.hits.hits.map((hit) => hit._source);
  } catch (error) {
    console.error('Error searching sentences:', error);
    throw error;
  }
}

module.exports = {
  initializeIndex,
  indexSentences,
  searchSentences,
};
