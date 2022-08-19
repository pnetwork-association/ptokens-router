const {
  zip,
  keys,
} = require('ramda')
const { getDeployedRouterContract } = require('./get-deployed-contract')
const { callReadOnlyFxnInContract } = require('./contract-utils')
const { constants: { metadataChainIds, ZERO_ADDRESS } } = require('ptokens-utils')

const getExistingVaultAddresses = _contract => {
  const metadataChainIdKeys = keys(metadataChainIds)
  return Promise.all(
    metadataChainIdKeys.map(_key =>
      callReadOnlyFxnInContract('interimVaultAddresses', [ metadataChainIds[_key] ], _contract)
    )
  )
    .then(zip(metadataChainIdKeys))
    .then(_arr =>
      _arr.reduce((_acc, [ _network, _address ]) => {
        if (_address !== ZERO_ADDRESS) _acc[_network] = _address
        return _acc
      }, {})
    )
}

const getVaultAddresses = _deployedContractAddress =>
  getDeployedRouterContract(_deployedContractAddress)
    .then(getExistingVaultAddresses)
    .then(console.table)

module.exports = {
  getExistingVaultAddresses,
  getVaultAddresses,
}
