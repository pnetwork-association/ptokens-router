const { getRouterContractAndCallFunctionAndAwaitReceipt } = require('./contract-utils')

const addVaultAddress = (_contractAddress, _chainId, _vaultAddress) =>
  getRouterContractAndCallFunctionAndAwaitReceipt(
    `✔ Adding ${_vaultAddress} as vault address with chain ID: ${_chainId} to router at ${_contractAddress}...`,
    _contractAddress,
    'addVaultAddress',
    [ _chainId, _vaultAddress ],
  )

module.exports = { addVaultAddress }
