#!/usr/bin/env node

require('dotenv').config()
const { docopt } = require('docopt')
const { version } = require('./package.json')
const { deployContract } = require('./lib/deploy-contract')
const { verifyContract } = require('./lib/verify-contract')

const TOOL_NAME = 'cli.js'
const HELP_OPTION = '--help'
const NETWORK_ARG = '<network>'
const VERSION_OPTION = '--version'
const VERIFY_CONTRACT_CMD = 'verifyContract'
const DEPLOY_CONTRACT_CMD = 'deployContract'
const DEPLOYED_ADDRESS_ARG = '<deployedAddress>'

const USAGE_INFO = `
❍ pTokens Router Contract Command Line Interface

  Copyright Provable Things 2021
  Questions: greg@oraclize.it

❍ Info:

  A tool to aid with deployments of & interactions with the upgradeable pToken Router logic contract.

  NOTE: Functions that make transactions require a private key. Please provide a GPG encrpyted file called
   'private-key.gpg' containing your key in the root of the repository. Create one via:
   'echo <your-private-key> | gpg -c --output private-key.gpg'

  NOTE: The tool requires a '.env' file to exist in the root of the repository with the following info:
    ENDPOINT=<rpc-endpoint-for-blochain-to-interact-with>

  NOTE: To call the '${VERIFY_CONTRACT_CMD}' function, the following extra environment variable is required:
    ETHERSCAN_API_KEY=<api-key-for-automated-contract-verifications>

❍ Usage:
  ${TOOL_NAME} ${HELP_OPTION}
  ${TOOL_NAME} ${VERSION_OPTION}
  ${TOOL_NAME} ${DEPLOY_CONTRACT_CMD}
  ${TOOL_NAME} ${VERIFY_CONTRACT_CMD} ${DEPLOYED_ADDRESS_ARG} ${NETWORK_ARG}

❍ Commands:
  ${DEPLOY_CONTRACT_CMD}        ❍ Deploy the logic contract.
  ${VERIFY_CONTRACT_CMD}        ❍ Verify the logic contract.

❍ Options:
  ${HELP_OPTION}                ❍ Show this message.
  ${VERSION_OPTION}             ❍ Show tool version.
  ${DEPLOYED_ADDRESS_ARG}     ❍ The ETH address of the deployed pToken.
  ${NETWORK_ARG}             ❍ Network the contract is deployed on. It must exist in the 'hardhat.config.json'.
`

const main = _ => {
  const CLI_ARGS = docopt(USAGE_INFO, { version })
  if (CLI_ARGS[DEPLOY_CONTRACT_CMD])
    return deployContract()
  if (CLI_ARGS[VERIFY_CONTRACT_CMD])
    return verifyContract(CLI_ARGS[DEPLOYED_ADDRESS_ARG], CLI_ARGS[NETWORK_ARG])
}

main().catch(_err => console.error('✘', _err.message))
