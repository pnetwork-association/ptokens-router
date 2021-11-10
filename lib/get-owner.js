const { getDeployedContract } = require('./get-deployed-contract')
const { callReadOnlyFxnInContract } = require('./contract-utils')

const getOwner = (_deployedContractAddress, _recipient, _amount) =>
  getDeployedContract(_deployedContractAddress)
    .then(_contract => callReadOnlyFxnInContract('owner', [], _contract))
    .then(console.info)

module.exports = { getOwner }
