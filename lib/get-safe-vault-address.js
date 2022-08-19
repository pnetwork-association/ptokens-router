const { getDeployedRouterContract } = require('./get-deployed-contract')
const { callReadOnlyFxnInContract } = require('./contract-utils')

const getSafeVaultAddress = (_deployedContractAddress) =>
  getDeployedRouterContract(_deployedContractAddress)
    .then(callReadOnlyFxnInContract('SAFE_VAULT_ADDRESS', []))
    .then(console.info)

module.exports = { getSafeVaultAddress }
