const path = require('path')
const { readFileSync } = require('fs')
const { exec } = require('child_process')
const { checkEthAddress } = require('./utils')
const { ETHERSCAN_ENV_VAR_KEY } = require('./constants')
const { getEnvConfiguration } = require('./get-env-configuration')
const { checkEnvironmentVariableExists } = require('./get-environment-variable')

const HARDHAT_CONFIG_FILE_NAME = 'hardhat.config.js'

const getRouterVerificationCommand = (_address, _network) => {
  /* eslint-disable-next-line max-len */
  return `npx hardhat verify --contract contracts/PTokensRouter.sol:PTokensRouter --network ${_network} ${_address}`
}

const getFeeVerificationCommand = (_address, _network, _feeSinkAddress, _pegInBasisPoints, _pegOutBasisPoints) => {
  /* eslint-disable-next-line max-len */
  return `npx hardhat verify --contract contracts/PTokensFees.sol:PTokensFees --network ${_network} ${_address} "${_feeSinkAddress}" "${_pegInBasisPoints}" "${_pegOutBasisPoints}"`
}

const executeVerificationCommand = _cmd =>
  console.info('✔ Executing verification command...') ||
  new Promise((resolve, reject) =>
    exec(_cmd, (_err, _stdout, _stderr) => _err ? reject(_err) : _stderr ? reject(_stderr) : resolve(_stdout))
  )

const getHardhatConfig = _ =>
  new Promise((resolve, reject) => {
    try {
      const config = readFileSync(path.resolve(__dirname, `../${HARDHAT_CONFIG_FILE_NAME}`)).toString()
      return resolve(config)
    } catch (_err) {
      return reject(_err)
    }
  })

const checkNetwork = _network =>
  console.info('✔ Checking network exists in hardhat config...') ||
  getHardhatConfig()
    .then(_configString =>
      _configString.includes(_network)
        ? console.info('✔ Network exists in config!') || _network
        : Promise.reject(new Error(`✘ '${_network}' does NOT exist in '${HARDHAT_CONFIG_FILE_NAME}'!`))
    )

const verifyContract = (_contractName, _address, _network, _deployArgs = []) =>
  console.info(`✔ Verifying the ${_contractName.toLowerCase()} contract...`) ||
  getEnvConfiguration()
    .then(_ => checkEthAddress(_address))
    .then(_ => checkNetwork(_network))
    .then(_ => checkEnvironmentVariableExists(ETHERSCAN_ENV_VAR_KEY))
    .then(_ => _contractName.toLowerCase() === 'router'
      ? getRouterVerificationCommand(_address, _network)
      : getFeeVerificationCommand(_address, _network, ..._deployArgs)
    )
    .then(executeVerificationCommand)
    .then(console.info)
    .catch(_err =>
      _err.message.includes('etherscan.apiKey.trim is not a function')
        ? Promise.reject(new Error(
          `Please set a valid etherscan API key via the environment variable '${ETHERSCAN_ENV_VAR_KEY}'!`
        ))
        : Promise.reject(_err)
    )

const verifyFeeContract = (_address, _network, _feeSinkAddress, _pegInBasisPoints, _pegOutBasisPoints) =>
  verifyContract('Fee', _address, _network, [ _feeSinkAddress, _pegInBasisPoints, _pegOutBasisPoints ])

const verifyRouterContract = (_address, _network) =>
  verifyContract('Router', _address, _network, [])

module.exports = {
  verifyRouterContract,
  verifyFeeContract,
}
