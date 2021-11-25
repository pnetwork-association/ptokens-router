#!/usr/bin/env node
/* eslint-disable max-len */

require('dotenv').config()
const { docopt } = require('docopt')
const { version } = require('./package.json')
const { getOwner } = require('./lib/get-owner')
const { transferOwner } = require('./lib/transfer-owner')
const { deployContract } = require('./lib/deploy-contract')
const { verifyContract } = require('./lib/verify-contract')
const { addVaultAddress } = require('./lib/add-vault-address')
const { removeVaultAddress } = require('./lib/remove-vault-address')

const TOOL_NAME = 'cli.js'
const HELP_OPTION = '--help'
const NETWORK_ARG = '<network>'
const CHAIN_ID_ARG = '<chainId>'
const GET_OWNER_CMD = 'getOwner'
const VERSION_OPTION = '--version'
const ETH_ADDRESS_ARG = '<ethAddress>'
const TRANSFER_OWNER_CMD = 'transferOwner'
const VERIFY_CONTRACT_CMD = 'verifyContract'
const DEPLOY_CONTRACT_CMD = 'deployContract'
const ADD_VAULT_ADDRESS_CMD = 'addVaultAddress'
const DEPLOYED_ADDRESS_ARG = '<deployedAddress>'
const REMOVE_VAULT_ADDRESS_CMD = 'removeVaultAddress'

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
  ${TOOL_NAME} ${GET_OWNER_CMD} ${DEPLOYED_ADDRESS_ARG}
  ${TOOL_NAME} ${VERIFY_CONTRACT_CMD} ${DEPLOYED_ADDRESS_ARG} ${NETWORK_ARG}
  ${TOOL_NAME} ${TRANSFER_OWNER_CMD} ${DEPLOYED_ADDRESS_ARG} ${ETH_ADDRESS_ARG}
  ${TOOL_NAME} ${REMOVE_VAULT_ADDRESS_CMD} ${DEPLOYED_ADDRESS_ARG} ${CHAIN_ID_ARG}
  ${TOOL_NAME} ${ADD_VAULT_ADDRESS_CMD} ${DEPLOYED_ADDRESS_ARG} ${CHAIN_ID_ARG} ${ETH_ADDRESS_ARG}

❍ Commands:
  ${DEPLOY_CONTRACT_CMD}        ❍ Deploy the logic contract.
  ${VERIFY_CONTRACT_CMD}        ❍ Verify the logic contract.
  ${GET_OWNER_CMD}              ❍ Get the owner of the contract at ${DEPLOYED_ADDRESS_ARG}.
  ${REMOVE_VAULT_ADDRESS_CMD}    ❍ Removess vault address with ${CHAIN_ID_ARG} from ${DEPLOYED_ADDRESS_ARG}.
  ${TRANSFER_OWNER_CMD}         ❍ Transfer ownership of contract at ${DEPLOYED_ADDRESS_ARG} to ${ETH_ADDRESS_ARG}.
  ${ADD_VAULT_ADDRESS_CMD}       ❍ Adds ${ETH_ADDRESS_ARG} as vault address with ${CHAIN_ID_ARG} to ${DEPLOYED_ADDRESS_ARG}.

❍ Options:
  ${HELP_OPTION}                ❍ Show this message.
  ${VERSION_OPTION}             ❍ Show tool version.
  ${ETH_ADDRESS_ARG}          ❍ A valid ETH address.
  ${DEPLOYED_ADDRESS_ARG}     ❍ The ETH address of the deployed pToken.
  ${CHAIN_ID_ARG}             ❍ A pToken metadata chain ID, as a 'bytes4' solidity type.
  ${NETWORK_ARG}             ❍ Network the contract is deployed on. It must exist in the 'hardhat.config.json'.
`

const main = _ => {
  const CLI_ARGS = docopt(USAGE_INFO, { version })
  if (CLI_ARGS[DEPLOY_CONTRACT_CMD])
    return deployContract()
  if (CLI_ARGS[VERIFY_CONTRACT_CMD])
    return verifyContract(CLI_ARGS[DEPLOYED_ADDRESS_ARG], CLI_ARGS[NETWORK_ARG])
  if (CLI_ARGS[GET_OWNER_CMD])
    return getOwner(CLI_ARGS[DEPLOYED_ADDRESS_ARG])
  if (CLI_ARGS[TRANSFER_OWNER_CMD])
    return transferOwner(CLI_ARGS[DEPLOYED_ADDRESS_ARG], CLI_ARGS[ETH_ADDRESS_ARG])
  if (CLI_ARGS[ADD_VAULT_ADDRESS_CMD])
    return addVaultAddress(CLI_ARGS[DEPLOYED_ADDRESS_ARG], CLI_ARGS[CHAIN_ID_ARG], CLI_ARGS[ETH_ADDRESS_ARG])
  if (CLI_ARGS[ADD_VAULT_ADDRESS_CMD])
    return removeVaultAddress(CLI_ARGS[DEPLOYED_ADDRESS_ARG], CLI_ARGS[CHAIN_ID_ARG])
}

main().catch(_err => console.error('✘', _err.message))
