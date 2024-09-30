const { Client } = require('@elastic/elasticsearch');

const client = new Client({
  node: `http://${process.env.ELASTICSEARCH_HOST}:${process.env.ELASTICSEARCH_PORT}`,
});

const INDEX_NAME = 'sentences';
const CHUNK_SIZE = 1000; // Adjust this value based on your data size and Elasticsearch setup

async function initializeIndex() {
  try {
    const indexExists = await client.indices.exists({ index: INDEX_NAME });
    if (!indexExists.body) {
      await client.indices.create({
        index: INDEX_NAME,
        body: {
          mappings: {
            properties: {
              spanish: { type: 'text', analyzer: 'standard' },
              english: { type: 'text', analyzer: 'standard' },
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

async function getDocumentCount() {
  try {
    const { body } = await client.count({ index: INDEX_NAME });
    return body.count;
  } catch (error) {
    console.error('Error getting document count:', error);
    throw error;
  }
}

async function indexSentences(sentences) {
  try {
    console.log(`Starting to index ${sentences.length} sentences...`);
    for (let i = 0; i < sentences.length; i += CHUNK_SIZE) {
      const chunk = sentences.slice(i, i + CHUNK_SIZE);
      const body = chunk.flatMap((sentence) => [
        { index: { _index: INDEX_NAME } },
        {
          spanish: sentence.spanish,
          english: sentence.english,
        },
      ]);
      const { body: bulkResponse } = await client.bulk({ refresh: true, body });
      if (bulkResponse.errors) {
        console.error('Errors in bulk operation:', bulkResponse.errors);
      }
      console.log(`Indexed sentences ${i + 1} to ${i + chunk.length}`);
    }
    console.log(`Finished indexing ${sentences.length} sentences.`);
  } catch (error) {
    console.error('Error indexing sentences:', error);
    throw error;
  }
}

async function searchSentences(query, size = 50) {
  try {
    const { body } = await client.search({
      index: INDEX_NAME,
      body: {
        size: size,
        query: {
          bool: {
            should: [
              { match_phrase: { spanish: query } },
              { match_phrase: { english: query } },
            ],
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
  getDocumentCount,
};
