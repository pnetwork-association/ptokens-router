const { curry } = require('ramda')
const { getFeeContractAndCallFunctionAndAwaitReceipt } = require('./contract-utils')

const setBasisPoints = curry((_isPegIn, _contractAddress, _basisPoints) =>
  getFeeContractAndCallFunctionAndAwaitReceipt(
    `✔ Setting peg-${_isPegIn ? 'in' : 'out'} basis points to ${_basisPoints}...`,
    _contractAddress,
    `setPeg${_isPegIn ? 'In' : 'Out'}BasisPoints`,
    [ _basisPoints ],
  )
)

const setPegInBasisPoints = setBasisPoints(true)
const setPegOutBasisPoints = setBasisPoints(false)

module.exports = {
  setPegInBasisPoints,
  setPegOutBasisPoints,
}
