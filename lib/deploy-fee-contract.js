const { prop } = require('ramda')
const { getProvider } = require('./get-provider')
const { checkEndpoint } = require('./check-endpoint')
const { ENDPOINT_ENV_VAR_KEY } = require('./constants')
const { getEthersWallet } = require('./get-ethers-wallet')
const { getEnvConfiguration } = require('./get-env-configuration')
const { getFeeContractFactory } = require('./get-contract-factory')
const { deployEthersContract } = require('./deploy-ethers-contract')
const { getEnvironmentVariable } = require('./get-environment-variable')

const deployFeeContract = (_feeSinkAddress, _pegInBasisPoints, _pegOutBasisPoints) =>
  console.info('✔ Deploying logic contract...') ||
  getEnvConfiguration()
    .then(() => getEnvironmentVariable(ENDPOINT_ENV_VAR_KEY))
    .then(getProvider)
    .then(checkEndpoint)
    .then(getEthersWallet)
    .then(getFeeContractFactory)
    .then(_factory => deployEthersContract(_factory, [ _feeSinkAddress, _pegInBasisPoints, _pegOutBasisPoints ]))
    .then(_contract => _contract.deployTransaction.wait())
    .then(_receipt => console.info(`✔ Tx Mined! Contract address: ${prop('contractAddress', _receipt)}`))

module.exports = { deployFeeContract }
