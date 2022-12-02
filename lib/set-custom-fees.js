const { curry } = require('ramda')
const { getFeeContractAndCallFunctionAndAwaitReceipt } = require('./contract-utils')

const setCustomFee = curry((_isPegIn, _contractAddress, _tokenAddress, _basisPoints) =>
  getFeeContractAndCallFunctionAndAwaitReceipt(
    `✔ Setting custom peg-${_isPegIn ? 'in' : 'out'} fee for ${_tokenAddress} to ${_basisPoints}...`,
    _contractAddress,
    `setCustomPeg${_isPegIn ? 'In' : 'Out'}Fee`,
    [ _tokenAddress, _basisPoints ],
  )
)

const setCustomPegInFee = setCustomFee(true)
const setCustomPegOutFee = setCustomFee(false)

module.exports = {
  setCustomPegInFee,
  setCustomPegOutFee,
}
