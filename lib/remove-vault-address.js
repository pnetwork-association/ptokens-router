const { getRouterContractAndCallFunctionAndAwaitReceipt } = require('./contract-utils')

const removeVaultAddress = (_contractAddress, _chainId) =>
  getRouterContractAndCallFunctionAndAwaitReceipt(
    `✔ Removing vault address with chain ID: ${_chainId} from router at ${_contractAddress}...`,
    _contractAddress,
    'removeVaultAddress',
    [ _chainId ],
  )

module.exports = { removeVaultAddress }
