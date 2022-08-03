const { constants: { metadataChainIds } } = require('ptokens-utils')

const showChainIds = _ =>
  Promise.resolve(console.table(metadataChainIds))

module.exports = { showChainIds }
