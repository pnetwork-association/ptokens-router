const { assoc } = require('ramda')
const { getFeeContract } = require('./get-deployed-contract')
const { convertSnakeCaseStringToCamelCase } = require('./utils')
const { callReadOnlyFxnInContract } = require('./contract-utils')

const EMPTY_FXN_ARGS = []

const FEE_CONTRACT_STATE_VARIABLES = [
  'FEE_SINK_ADDRESS',
  'PEG_IN_BASIS_POINTS',
  'PEG_OUT_BASIS_POINTS',
  'MAX_FEE_BASIS_POINTS',
]

const getFeeContractState = (_feeContractAddress, _wallet) =>
  getFeeContract(_feeContractAddress, _wallet)
    .then(_feeContract =>
      Promise.all(
        FEE_CONTRACT_STATE_VARIABLES.map(_var => callReadOnlyFxnInContract(_var, EMPTY_FXN_ARGS, _feeContract))
      )
    )
    .then(_res =>
      FEE_CONTRACT_STATE_VARIABLES
        .reduce((_obj, _variableName, _i) => {
          const key = convertSnakeCaseStringToCamelCase(_variableName)
          let value = _res[_i]
          if (value._isBigNumber === true)
            value = value.toString()

          return assoc(key, value, _obj)
        },
        {},
        )
    )
    .then(assoc('feeContractAddress', _feeContractAddress))

module.exports = { getFeeContractState }
