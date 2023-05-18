const {
  getRouterContractAbi,
  getSafeVaultContractAbi,
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

const getEthersContract = curry((_address, _abi, _wallet) => {
  console.info(`✔ Getting contract @ '${_address}'...`)
  return Promise.resolve(new ethers.Contract(_address, _abi, _wallet))
})

const getSafeVaultContract = (_address, _wallet) =>
  getSafeVaultContractAbi().then(_abi => getEthersContract(_address, _abi, _wallet))

const getRouterContract = (_address, _wallet) =>
  getRouterContractAbi().then(_abi => getEthersContract(_address, _abi, _wallet))

const getDeployedContract = curry((_contractType, _deployedContractAddress) =>
  console.info(`✔ Getting ${_contractType} contract @ '${_deployedContractAddress}'...`) ||
  getEnvConfiguration()
    .then(() => getEnvironmentVariable(ENDPOINT_ENV_VAR_KEY))
    .then(getProvider)
    .then(checkEndpoint)
    .then(getEthersWallet)
    .then(_wallet => {
      const contractType = _contractType.toLowerCase()
      if (contractType === 'router')
        return getRouterContract(_deployedContractAddress, _wallet)
      else if (contractType === 'safevault')
        return getSafeVaultContract(_deployedContractAddress, _wallet)
      else
        return Promise.reject(new Error(`Unrecongized contract type: ${_contractType}`))
    })
    .then(_contract => console.info('✔ Contract retrieved!') || _contract)
)

const getDeployedRouterContract = getDeployedContract('router')
const getDeployedSafeVaultContract = getDeployedContract('safeVault')

module.exports = {
  getDeployedSafeVaultContract,
  getDeployedRouterContract,
  getSafeVaultContract,
}
