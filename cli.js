#!/usr/bin/env node
/* eslint-disable max-len */

require('dotenv').config()
const { docopt } = require('docopt')
const { version } = require('./package.json')
const { getAdmins } = require('./lib/get-admins')
const { deployContract } = require('./lib/deploy-contract')
const { verifyContract } = require('./lib/verify-contract')
const { addVaultAddress } = require('./lib/add-vault-address')
const { getVaultAddress } = require('./lib/get-vault-address')
const { showWalletDetails } = require('./lib/show-wallet-details')
const { removeVaultAddress } = require('./lib/remove-vault-address')
const { getEncodedInitArgs } = require('./lib/get-encoded-init-args')
const { getSafeVaultAddress } = require('./lib/get-safe-vault-address')
const { showExistingContractAddresses } = require('./lib/show-existing-contracts')

const TOOL_NAME = 'cli.js'
const HELP_OPTION = '--help'
const NETWORK_ARG = '<network>'
const CHAIN_ID_ARG = '<chainId>'
const GET_ADMINS_CMD = 'getAdmins'
const VERSION_OPTION = '--version'
const ETH_ADDRESS_ARG = '<ethAddress>'
const VERIFY_CONTRACT_CMD = 'verifyContract'
const DEPLOY_CONTRACT_CMD = 'deployContract'
const ADD_VAULT_ADDRESS_CMD = 'addVaultAddress'
const GET_VAULT_ADDRESS_CMD = 'getVaultAddress'
const DEPLOYED_ADDRESS_ARG = '<deployedAddress>'
const GET_ENCODED_INIT_ARGS_CMD = 'encodeInitArgs'
const SHOW_WALLET_DETAILS_CMD = 'showWalletDetails'
const REMOVE_VAULT_ADDRESS_CMD = 'removeVaultAddress'
const GET_SAFE_VAULT_ADDRESS_CMD = 'getSafeVaultAddress'
const SHOW_EXISTING_CONTRACTS_CMD = 'showExistingContracts'

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
  ${TOOL_NAME} ${SHOW_WALLET_DETAILS_CMD}
  ${TOOL_NAME} ${SHOW_EXISTING_CONTRACTS_CMD}
  ${TOOL_NAME} ${GET_ADMINS_CMD} ${DEPLOYED_ADDRESS_ARG}
  ${TOOL_NAME} ${GET_ENCODED_INIT_ARGS_CMD} ${ETH_ADDRESS_ARG}
  ${TOOL_NAME} ${GET_SAFE_VAULT_ADDRESS_CMD} ${DEPLOYED_ADDRESS_ARG}
  ${TOOL_NAME} ${VERIFY_CONTRACT_CMD} ${NETWORK_ARG} ${DEPLOYED_ADDRESS_ARG}
  ${TOOL_NAME} ${GET_VAULT_ADDRESS_CMD} ${DEPLOYED_ADDRESS_ARG} ${CHAIN_ID_ARG}
  ${TOOL_NAME} ${REMOVE_VAULT_ADDRESS_CMD} ${DEPLOYED_ADDRESS_ARG} ${CHAIN_ID_ARG}
  ${TOOL_NAME} ${ADD_VAULT_ADDRESS_CMD} ${DEPLOYED_ADDRESS_ARG} ${CHAIN_ID_ARG} ${ETH_ADDRESS_ARG}

❍ Commands:
  ${DEPLOY_CONTRACT_CMD}        ❍ Deploy the logic contract.
  ${VERIFY_CONTRACT_CMD}        ❍ Verify the logic contract.
  ${GET_ADMINS_CMD}             ❍ Get the admins of the contract at ${DEPLOYED_ADDRESS_ARG}.
  ${REMOVE_VAULT_ADDRESS_CMD}    ❍ Removess vault address with ${CHAIN_ID_ARG} from ${DEPLOYED_ADDRESS_ARG}.
  ${GET_VAULT_ADDRESS_CMD}       ❍ Get vault address from router at ${DEPLOYED_ADDRESS_ARG} via ${CHAIN_ID_ARG}.
  ${SHOW_WALLET_DETAILS_CMD}     ❍ Decrypts the private key and shows address & balance information.
  ${GET_SAFE_VAULT_ADDRESS_CMD}   ❍ Get the safe vault address set in the router at ${DEPLOYED_ADDRESS_ARG}.
  ${GET_ENCODED_INIT_ARGS_CMD}        ❍ Calculate the initializer function arguments in ABI encoded format.
  ${ADD_VAULT_ADDRESS_CMD}       ❍ Adds ${ETH_ADDRESS_ARG} as vault address with ${CHAIN_ID_ARG} to ${DEPLOYED_ADDRESS_ARG}.
  ${SHOW_EXISTING_CONTRACTS_CMD} ❍ Show list of existing pToken logic contract addresses on various blockchains.


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
  if (CLI_ARGS[ADD_VAULT_ADDRESS_CMD])
    return addVaultAddress(CLI_ARGS[DEPLOYED_ADDRESS_ARG], CLI_ARGS[CHAIN_ID_ARG], CLI_ARGS[ETH_ADDRESS_ARG])
  if (CLI_ARGS[REMOVE_VAULT_ADDRESS_CMD])
    return removeVaultAddress(CLI_ARGS[DEPLOYED_ADDRESS_ARG], CLI_ARGS[CHAIN_ID_ARG])
  if (CLI_ARGS[GET_ENCODED_INIT_ARGS_CMD])
    return getEncodedInitArgs(CLI_ARGS[ETH_ADDRESS_ARG])
  if (CLI_ARGS[SHOW_WALLET_DETAILS_CMD])
    return showWalletDetails()
  if (CLI_ARGS[GET_VAULT_ADDRESS_CMD])
    return getVaultAddress(CLI_ARGS[DEPLOYED_ADDRESS_ARG], CLI_ARGS[CHAIN_ID_ARG])
  if (CLI_ARGS[SHOW_EXISTING_CONTRACTS_CMD])
    return showExistingContractAddresses()
  if (CLI_ARGS[GET_SAFE_VAULT_ADDRESS_CMD])
    return getSafeVaultAddress(CLI_ARGS[DEPLOYED_ADDRESS_ARG])
  if (CLI_ARGS[GET_ADMINS_CMD])
    return getAdmins(CLI_ARGS[DEPLOYED_ADDRESS_ARG], CLI_ARGS[ETH_ADDRESS_ARG])
}

main().catch(_err => console.error('✘', _err.message))
