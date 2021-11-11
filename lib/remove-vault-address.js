const { getDeployedContractAndCallFunctionAndAwaitReceipt } = require('./contract-utils')

const removeVaultAddress = (_contractAddress, _chainId) =>
  getDeployedContractAndCallFunctionAndAwaitReceipt(
    `✔ Removing vault address with chain ID: ${_chainId} from router at ${_contractAddress}...`,
    _contractAddress,
    'addVaultAddress',
    [ _chainId ],
  )

module.exports = { removeVaultAddress }
