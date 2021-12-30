const { callReadOnlyFxnInContract } = require('./contract-utils')
const { getDeployedContract } = require('./get-deployed-contract')

const getVaultAddress = (_contractAddress, _chainId) =>
  console.info(`✔ Getting vault address from chain ID: ${_chainId}...`) ||
  getDeployedContract(_contractAddress)
    .then(callReadOnlyFxnInContract('interimVaultAddresses', [ _chainId ]))
    .then(console.info)

module.exports = { getVaultAddress }
