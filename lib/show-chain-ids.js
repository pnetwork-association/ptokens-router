const { constants: { metadataChainIds } } = require('@pnetwork-association/ptokens-utils')

const showChainIds = _ =>
  Promise.resolve(console.table(metadataChainIds))

module.exports = { showChainIds }
