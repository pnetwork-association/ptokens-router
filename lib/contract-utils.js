const { curry } = require('ramda')
const { getDeployedRouterContract } = require('./get-deployed-contract')

const callFxnInContract = (_fxnName, _fxnArgs, _contract) =>
  _contract[_fxnName](..._fxnArgs)

const callFxnInContractAndAwaitReceipt = curry((_fxnName, _fxnArgs, _contract) =>
  console.info(`✔ Calling '${_fxnName}' function in contract & awaiting mining for the receipt...`) ||
  callFxnInContract(_fxnName, _fxnArgs, _contract).then(_tx => _tx.wait())
)

const callReadOnlyFxnInContract = curry((_fxnName, _fxnArgs, _contract) =>
  console.info(`✔ Calling '${_fxnName}' function in contract...`) ||
  callFxnInContract(_fxnName, _fxnArgs, _contract)
)

const getRouterContractAndCallFunctionAndAwaitReceipt = (_logText, _contractAddress, _fxnName, _fxnArgs) =>
  console.info(_logText) ||
  getDeployedRouterContract(_contractAddress)
    .then(_contract => callFxnInContractAndAwaitReceipt(_fxnName, _fxnArgs, _contract))
    .then(_receipt => console.info('✔ Success! Transaction receipt:\n', _receipt))

module.exports = {
  getRouterContractAndCallFunctionAndAwaitReceipt,
  callFxnInContractAndAwaitReceipt,
  callReadOnlyFxnInContract,
}
