const { curry } = require('ramda')
const { getFeeContractAndCallFunctionAndAwaitReceipt } = require('./contract-utils')

const setFeeException = curry((_addFeeException, _contractAddress, _address) =>
  getFeeContractAndCallFunctionAndAwaitReceipt(
    `✔ ${_addFeeException ? `Adding '${_address}'e to` : `Removing '${_address}' from`} fee exception list...`,
    _contractAddress,
    `${_addFeeException ? 'add' : 'remove'}FeeException`,
    [ _address ],
  )
)

const addFeeException = setFeeException(true)
const removeFeeException = setFeeException(false)

module.exports = {
  addFeeException,
  removeFeeException,
}
