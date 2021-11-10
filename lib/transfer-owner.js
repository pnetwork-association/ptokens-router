const { getDeployedContract } = require('./get-deployed-contract')
const { callFxnInContractAndAwaitReceipt } = require('./contract-utils')

const transferOwner = (_deployedContractAddress, _newOwner) =>
  console.info(`✔ Transferring ownership to ${_newOwner}...`) ||
  getDeployedContract(_deployedContractAddress)
    .then(_contract => callFxnInContractAndAwaitReceipt('transferOwner', [ _newOwner ], _contract))
    .then(_receipt => console.info('✔ Success! Transaction receipt:\n', _receipt))

module.exports = { transferOwner }
