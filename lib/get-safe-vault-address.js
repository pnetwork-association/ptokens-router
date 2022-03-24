const { getDeployedContract } = require('./get-deployed-contract')
const { callReadOnlyFxnInContract } = require('./contract-utils')

const getSafeVaultAddress = (_deployedContractAddress) =>
  getDeployedContract(_deployedContractAddress)
    .then(callReadOnlyFxnInContract('SAFE_VAULT_ADDRESS', []))
    .then(console.info)

module.exports = { getSafeVaultAddress }
