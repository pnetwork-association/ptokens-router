const {
  getFeeContractAbi,
  getRouterContractAbi,
} = require('./get-contract-artifacts')
/* eslint-disable-next-line no-shadow */
const ethers = require('ethers')
const { curry } = require('ramda')
const { getProvider } = require('./get-provider')
const { checkEndpoint } = require('./check-endpoint')
const { ENDPOINT_ENV_VAR_KEY } = require('./constants')
const { getEthersWallet } = require('./get-ethers-wallet')
const { getEnvConfiguration } = require('./get-env-configuration')
const { getEnvironmentVariable } = require('./get-environment-variable')

const getEthersContract = curry((_address, _abi, _signer) => {
  console.info(`✔ Getting contract @ '${_address}'...`)
  return Promise.resolve(new ethers.Contract(_address, _abi, _signer))
})

const getDeployedContract = curry((_contractType, _deployedContractAddress) =>
  console.info(`✔ Getting ${_contractType} contract @ '${_deployedContractAddress}'...`) ||
  getEnvConfiguration()
    .then(() => getEnvironmentVariable(ENDPOINT_ENV_VAR_KEY))
    .then(getProvider)
    .then(checkEndpoint)
    .then(_endpoint =>
      Promise.all([
        getEthersWallet(_endpoint),
        _contractType.toLowerCase() === 'fee' ? getFeeContractAbi() : getRouterContractAbi()
      ])
    )
    .then(([ _wallet, _abi ]) => getEthersContract(_deployedContractAddress, _abi, _wallet))
    .then(_contract => console.info('✔ Contract retrieved!') || _contract)
)

const getDeployedFeeContract = getDeployedContract('fee')
const getDeployedRouterContract = getDeployedContract('router')

module.exports = {
  getDeployedRouterContract,
  getDeployedFeeContract,
}
