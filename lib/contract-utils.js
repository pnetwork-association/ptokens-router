const {
  getDeployedFeeContract,
  getDeployedRouterContract,
} = require('./get-deployed-contract')
const { curry } = require('ramda')

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

const getContractAndCallFunctionAndAwaitReceipt = curry((
  _contractType,
  _logText,
  _contractAddress,
  _fxnName,
  _fxnArgs
) => {
  const contractType = _contractType.toLowerCase()
  let getContractFxn
  if (contractType === 'router')
    getContractFxn = getDeployedRouterContract
  else if (contractType === 'fee')
    getContractFxn = getDeployedFeeContract
  else
    return Promise.reject(new Error(`Unrecognized contract type: ${_contractType}`))

  console.info(_logText)
  return getContractFxn(_contractAddress)
    .then(_contract => callFxnInContractAndAwaitReceipt(_fxnName, _fxnArgs, _contract))
    .then(_receipt => console.info('✔ Success! Transaction receipt:\n', _receipt))
})

const getFeeContractAndCallFunctionAndAwaitReceipt = getContractAndCallFunctionAndAwaitReceipt('fee')
const getRouterContractAndCallFunctionAndAwaitReceipt = getContractAndCallFunctionAndAwaitReceipt('router')

module.exports = {
  getRouterContractAndCallFunctionAndAwaitReceipt,
  getFeeContractAndCallFunctionAndAwaitReceipt,
  callFxnInContractAndAwaitReceipt,
  callReadOnlyFxnInContract,
}
