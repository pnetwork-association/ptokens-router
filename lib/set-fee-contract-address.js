const { getRouterContractAndCallFunctionAndAwaitReceipt } = require('./contract-utils')

const setFeeContractAddress = (_contractAddress, _address) =>
  getRouterContractAndCallFunctionAndAwaitReceipt(
    `✔ Changing address of the fee contract in the router to ${_address}...`,
    _contractAddress,
    'setFeeContractAddress',
    [ _address ],
  )

module.exports = { setFeeContractAddress }
