const elasticsearch = require('elasticsearch');
const config = require(__dirname + '/../../config.js');
const client = new elasticsearch.Client({
  host: config.elasticSearch.host,
  log: null,
});

module.exports.addDocumentWithIdToIndex = async (index, id, document) => {
  console.log('my elastic host is :', config.elasticSearch.host);
  const exists = await client.indices.exists({index});
  if (!exists) {
    // create this index
    await client.indices.create({index});
  }
  // let's add our data using our index
  await client.index({
    index,
    id,
    body: document,
  });
};
