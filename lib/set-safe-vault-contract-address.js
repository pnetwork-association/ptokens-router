const { getRouterContractAndCallFunctionAndAwaitReceipt } = require('./contract-utils')

const setSafeVaultContractAddress = (_contractAddress, _address) =>
  getRouterContractAndCallFunctionAndAwaitReceipt(
    `✔ Changing address of the safe vault contract in the router to ${_address}...`,
    _contractAddress,
    'updateSafeVaultAddress',
    [ _address ],
  )

module.exports = { setSafeVaultContractAddress }
