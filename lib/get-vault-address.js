const { callReadOnlyFxnInContract } = require('./contract-utils')
const { getDeployedRouterContract } = require('./get-deployed-contract')

const getVaultAddress = (_contractAddress, _chainId) =>
  console.info(`✔ Getting vault address from chain ID: ${_chainId}...`) ||
  getDeployedRouterContract(_contractAddress)
    .then(callReadOnlyFxnInContract('interimVaultAddresses', [ _chainId ]))
    .then(console.info)

module.exports = { getVaultAddress }
