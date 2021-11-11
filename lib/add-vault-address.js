const { getDeployedContractAndCallFunctionAndAwaitReceipt } = require('./contract-utils')

const addVaultAddress = (_deployedContractAddress, _chainId, _vaultAddress) =>
  getDeployedContractAndCallFunctionAndAwaitReceipt(
    `✔ Adding ${_vaultAddress} as vault address with chain ID: ${_chainId}...`,
    _deployedContractAddress,
    'addVaultAddress',
    [ _chainId, _vaultAddress ],
  )

module.exports = { addVaultAddress }
