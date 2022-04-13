const {
  has,
  assoc,
} = require('ramda')
const {
  ENDPOINT_ENV_VAR_KEY,
  ETHERSCAN_ENV_VAR_KEY
} = require('./lib/constants')

require('hardhat-erc1820')
require('@nomiclabs/hardhat-waffle')
require('@nomiclabs/hardhat-etherscan')
require('@openzeppelin/hardhat-upgrades')

const SUPPORTED_NETWORKS = [
  'rinkeby',
  'ropsten',
  'ambrosTestnet',
]

const checkEnvironmentVariableExists = _name => {
  if (!has(_name, process.env))
    throw new Error(`✘ Environment variable '${_name}' does not exist! Please provide it!`)
  else
    return _name
}

const getEnvironmentVariable = _name =>
  process.env[checkEnvironmentVariableExists(_name)]

const getAllSupportedNetworks = _ =>
  SUPPORTED_NETWORKS.reduce((_acc, _network) =>
    assoc(_network, { url: getEnvironmentVariable(ENDPOINT_ENV_VAR_KEY) }, _acc), {}
  )

const addLocalNetwork = _allSupportedNetworks =>
  assoc('localhost', { url: 'http://localhost:8545' }, _allSupportedNetworks)

const getAllNetworks = _ =>
  addLocalNetwork(getAllSupportedNetworks())

module.exports = {
  networks: getAllNetworks(),
  solidity: {
    version: '0.8.2',
    settings: {
      optimizer: {
        runs: 200,
        enabled: true,
      }
    }
  },
  etherscan: {
    apiKey: process.env[ETHERSCAN_ENV_VAR_KEY]
  },
}
