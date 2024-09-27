const { Client } = require('@elastic/elasticsearch');

const client = new Client({
  node: `http://${process.env.ELASTICSEARCH_HOST}:${process.env.ELASTICSEARCH_PORT}`,
});

const INDEX_NAME = 'sentences';

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

async function indexSentences(sentences) {
  try {
    const body = sentences.flatMap((sentence) => [
      { index: { _index: INDEX_NAME } },
      sentence,
    ]);
    await client.bulk({ refresh: true, body });
    console.log(`Indexed ${sentences.length} sentences.`);
  } catch (error) {
    console.error('Error indexing sentences:', error);
    throw error;
  }
}

async function searchSentences(query) {
  try {
    const { body } = await client.search({
      index: INDEX_NAME,
      body: {
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
};
