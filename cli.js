#!/usr/bin/env node
/* eslint-disable max-len */
const {
  verifyFeeContract,
  verifyRouterContract,
} = require('./lib/verify-contract')
const {
  setPegInBasisPoints,
  setPegOutBasisPoints,
} = require('./lib/set-basis-points')
const {
  addFeeException,
  removeFeeException,
} = require('./lib/set-fee-exception')
const { docopt } = require('docopt')
const { version } = require('./package.json')
const { getAdmins } = require('./lib/get-admins')
const { showChainIds } = require('./lib/show-chain-ids')
const { getRouterState } = require('./lib/get-router-state')
const { addVaultAddress } = require('./lib/add-vault-address')
const { getVaultAddress } = require('./lib/get-vault-address')
const { getVaultAddresses } = require('./lib/get-vault-addresses')
const { showWalletDetails } = require('./lib/show-wallet-details')
const { deployFeeContract } = require('./lib/deploy-fee-contract')
const { removeVaultAddress } = require('./lib/remove-vault-address')
const { getEncodedInitArgs } = require('./lib/get-encoded-init-args')
const { getSafeVaultAddress } = require('./lib/get-safe-vault-address')
const { deployRouterContract } = require('./lib/deploy-router-contract')
const { setFeeContractAddress } = require('./lib/set-fee-contract-address')
const { deploySafeVaultContract } = require('./lib/deploy-safe-vault-contract')
const { showExistingContractAddresses } = require('./lib/show-existing-contracts')

const TOOL_NAME = 'cli.js'
const HELP_OPTION = '--help'
const NETWORK_ARG = '<network>'
const CHAIN_ID_ARG = '<chainId>'
const GET_ADMINS_CMD = 'getAdmins'
const VERSION_OPTION = '--version'
const ETH_ADDRESS_ARG = '<ethAddress>'
const SHOW_CHAIN_IDS_CMD = 'showChainIds'
const GET_ROUTER_STATE = 'getRouterState'
const ADD_VAULT_ADDRESS_CMD = 'addVaultAddress'
const GET_VAULT_ADDRESS_CMD = 'getVaultAddress'
const ADD_FEE_EXCEPTION_CMD = 'addFeeException'
const FEE_SINK_ADDRESS_ARG = '<feeSinkAddress>'
const DEPLOYED_ADDRESS_ARG = '<deployedAddress>'
const GET_ENCODED_INIT_ARGS_CMD = 'encodeInitArgs'
const VERIFY_FEE_CONTRACT_CMD = 'verifyFeeContract'
const SHOW_WALLET_DETAILS_CMD = 'showWalletDetails'
const GET_VAULT_ADDRESSES_CMD = 'getVaultAddresses'
const DEPLOY_FEE_CONTRACT_CMD = 'deployFeeContract'
const SET_FEE_CONTRACT_ADDRESS_CMD = 'setFeeAddress'
const PEG_IN_BASIS_POINTS_ARG = '<pegInBasisPoints>'
const REMOVE_VAULT_ADDRESS_CMD = 'removeVaultAddress'
const REMOVE_FEE_EXCEPTION_CMD = 'removeFeeException'
const PEG_OUT_BASIS_POINTS_ARG = '<pegOutBasisPoints>'
const DEPLOY_SAFE_VAULT_CMD = 'deploySafeVaultContract'
const GET_SAFE_VAULT_ADDRESS_CMD = 'getSafeVaultAddress'
const VERIFY_ROUTER_CONTRACT_CMD = 'verifyRouterContract'
const SET_PEG_IN_BASIS_POINTS_CMD = 'setPegInBasisPoints'
const DEPLOY_ROUTER_CONTRACT_CMD = 'deployRouterContract'
const SET_PEG_OUT_BASIS_POINTS_CMD = 'setPegOutBasisPoints'
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

  NOTE: To call the '${VERIFY_ROUTER_CONTRACT_CMD}' function, this extra environment variable is required:
    ETHERSCAN_API_KEY=<api-key-for-automated-contract-verifications>

❍ Usage:
  ${TOOL_NAME} ${HELP_OPTION}
  ${TOOL_NAME} ${VERSION_OPTION}
  ${TOOL_NAME} ${SHOW_CHAIN_IDS_CMD}
  ${TOOL_NAME} ${SHOW_WALLET_DETAILS_CMD}
  ${TOOL_NAME} ${DEPLOY_ROUTER_CONTRACT_CMD}
  ${TOOL_NAME} ${SHOW_EXISTING_CONTRACTS_CMD}
  ${TOOL_NAME} ${DEPLOY_SAFE_VAULT_CMD}
  ${TOOL_NAME} ${GET_ADMINS_CMD} ${DEPLOYED_ADDRESS_ARG}
  ${TOOL_NAME} ${GET_ENCODED_INIT_ARGS_CMD} ${ETH_ADDRESS_ARG}
  ${TOOL_NAME} ${GET_ROUTER_STATE} ${DEPLOYED_ADDRESS_ARG}
  ${TOOL_NAME} ${GET_VAULT_ADDRESSES_CMD} ${DEPLOYED_ADDRESS_ARG}
  ${TOOL_NAME} ${GET_SAFE_VAULT_ADDRESS_CMD} ${DEPLOYED_ADDRESS_ARG}
  ${TOOL_NAME} ${GET_VAULT_ADDRESS_CMD} ${DEPLOYED_ADDRESS_ARG} ${CHAIN_ID_ARG}
  ${TOOL_NAME} ${SET_FEE_CONTRACT_ADDRESS_CMD} ${DEPLOYED_ADDRESS_ARG} ${ETH_ADDRESS_ARG}
  ${TOOL_NAME} ${REMOVE_VAULT_ADDRESS_CMD} ${DEPLOYED_ADDRESS_ARG} ${CHAIN_ID_ARG}
  ${TOOL_NAME} ${ADD_FEE_EXCEPTION_CMD} ${DEPLOYED_ADDRESS_ARG} ${ETH_ADDRESS_ARG}
  ${TOOL_NAME} ${VERIFY_ROUTER_CONTRACT_CMD} ${NETWORK_ARG} ${DEPLOYED_ADDRESS_ARG}
  ${TOOL_NAME} ${REMOVE_FEE_EXCEPTION_CMD} ${DEPLOYED_ADDRESS_ARG} ${ETH_ADDRESS_ARG}
  ${TOOL_NAME} ${SET_PEG_IN_BASIS_POINTS_CMD} ${DEPLOYED_ADDRESS_ARG} ${PEG_IN_BASIS_POINTS_ARG}
  ${TOOL_NAME} ${ADD_VAULT_ADDRESS_CMD} ${DEPLOYED_ADDRESS_ARG} ${CHAIN_ID_ARG} ${ETH_ADDRESS_ARG}
  ${TOOL_NAME} ${SET_PEG_OUT_BASIS_POINTS_CMD} ${DEPLOYED_ADDRESS_ARG} ${PEG_OUT_BASIS_POINTS_ARG}
  ${TOOL_NAME} ${DEPLOY_FEE_CONTRACT_CMD} ${FEE_SINK_ADDRESS_ARG} ${PEG_IN_BASIS_POINTS_ARG} ${PEG_OUT_BASIS_POINTS_ARG}
  ${TOOL_NAME} ${VERIFY_FEE_CONTRACT_CMD} ${DEPLOYED_ADDRESS_ARG} ${NETWORK_ARG} ${FEE_SINK_ADDRESS_ARG} ${PEG_IN_BASIS_POINTS_ARG} ${PEG_OUT_BASIS_POINTS_ARG}

❍ Commands:
  ${DEPLOY_FEE_CONTRACT_CMD}        ❍ Deploy the fee contract.
  ${VERIFY_FEE_CONTRACT_CMD}        ❍ Verify the fee contract.
  ${DEPLOY_SAFE_VAULT_CMD}  ❍ Deploy the safe vault contract.
  ${DEPLOY_ROUTER_CONTRACT_CMD}     ❍ Deploy the router logic contract.
  ${VERIFY_ROUTER_CONTRACT_CMD}     ❍ Verify the router logic contract.
  ${GET_VAULT_ADDRESSES_CMD}        ❍ Gets all set vault addresses at ${DEPLOYED_ADDRESS_ARG}.
  ${GET_ADMINS_CMD}                ❍ Get the admins of the contract at ${DEPLOYED_ADDRESS_ARG}.
  ${SET_FEE_CONTRACT_ADDRESS_CMD}            ❍ Set the fee contract stored in the router to ${ETH_ADDRESS_ARG}.
  ${REMOVE_VAULT_ADDRESS_CMD}       ❍ Removess vault address with ${CHAIN_ID_ARG} from ${DEPLOYED_ADDRESS_ARG}.
  ${GET_VAULT_ADDRESS_CMD}          ❍ Get vault address from router at ${DEPLOYED_ADDRESS_ARG} via ${CHAIN_ID_ARG}.
  ${ADD_FEE_EXCEPTION_CMD}          ❍ Adds ${ETH_ADDRESS_ARG} to the fee exception list in the fee contract.
  ${SHOW_WALLET_DETAILS_CMD}        ❍ Decrypts the private key and shows address & balance information.
  ${GET_SAFE_VAULT_ADDRESS_CMD}      ❍ Get the safe vault address set in the router at ${DEPLOYED_ADDRESS_ARG}.
  ${GET_ROUTER_STATE}           ❍ Gets all supported tokens from all vaults set in ${DEPLOYED_ADDRESS_ARG}.
  ${GET_ENCODED_INIT_ARGS_CMD}           ❍ Calculate the initializer function arguments in ABI encoded format.
  ${REMOVE_FEE_EXCEPTION_CMD}       ❍ Removes ${ETH_ADDRESS_ARG} from the fee exception list in the fee contract.
  ${ADD_VAULT_ADDRESS_CMD}          ❍ Adds ${ETH_ADDRESS_ARG} as vault address with ${CHAIN_ID_ARG} to ${DEPLOYED_ADDRESS_ARG}.
  ${SHOW_CHAIN_IDS_CMD}             ❍ Shows a list of the metadata chain IDs for supported pNetwork blockchains.
  ${SHOW_EXISTING_CONTRACTS_CMD}    ❍ Show list of existing pToken logic contract addresses on various blockchains.
  ${SET_PEG_IN_BASIS_POINTS_CMD}      ❍ Sets the peg-in basis points in the fee contract @ ${DEPLOYED_ADDRESS_ARG} to ${PEG_IN_BASIS_POINTS_ARG}.
  ${SET_PEG_OUT_BASIS_POINTS_CMD}     ❍ Sets the peg-out basis points in the fee contract @ ${DEPLOYED_ADDRESS_ARG} to ${PEG_OUT_BASIS_POINTS_ARG}.


❍ Options:
  ${HELP_OPTION}                   ❍ Show this message.
  ${VERSION_OPTION}                ❍ Show tool version.
  ${ETH_ADDRESS_ARG}             ❍ A valid ETH address.
  ${DEPLOYED_ADDRESS_ARG}        ❍ The ETH address of the deployed pToken.
  ${CHAIN_ID_ARG}                ❍ A pToken metadata chain ID, as a 'bytes4' solidity type.
  ${PEG_IN_BASIS_POINTS_ARG}       ❍ The basis points used to calculate a fee during a peg in.
  ${PEG_OUT_BASIS_POINTS_ARG}      ❍ The basis points used to calculate a fee during a peg out.
  ${FEE_SINK_ADDRESS_ARG}         ❍ The address set in the fee contract where fees are accrued.
  ${NETWORK_ARG}                ❍ Network the contract is deployed on. It must exist in the 'hardhat.config.json'.
`

const main = _ => {
  const CLI_ARGS = docopt(USAGE_INFO, { version })
  if (CLI_ARGS[DEPLOY_ROUTER_CONTRACT_CMD])
    return deployRouterContract()
  if (CLI_ARGS[VERIFY_ROUTER_CONTRACT_CMD])
    return verifyRouterContract(CLI_ARGS[DEPLOYED_ADDRESS_ARG], CLI_ARGS[NETWORK_ARG])
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
  if (CLI_ARGS[SHOW_CHAIN_IDS_CMD])
    return showChainIds()
  if (CLI_ARGS[GET_VAULT_ADDRESSES_CMD])
    return getVaultAddresses(CLI_ARGS[DEPLOYED_ADDRESS_ARG])
  if (CLI_ARGS[GET_ROUTER_STATE])
    return getRouterState(CLI_ARGS[DEPLOYED_ADDRESS_ARG])
  if (CLI_ARGS[SET_FEE_CONTRACT_ADDRESS_CMD])
    return setFeeContractAddress(CLI_ARGS[DEPLOYED_ADDRESS_ARG], CLI_ARGS[ETH_ADDRESS_ARG])
  if (CLI_ARGS[SET_PEG_IN_BASIS_POINTS_CMD])
    return setPegInBasisPoints(CLI_ARGS[DEPLOYED_ADDRESS_ARG], CLI_ARGS[PEG_IN_BASIS_POINTS_ARG])
  if (CLI_ARGS[SET_PEG_OUT_BASIS_POINTS_CMD])
    return setPegOutBasisPoints(CLI_ARGS[DEPLOYED_ADDRESS_ARG], CLI_ARGS[PEG_OUT_BASIS_POINTS_ARG])
  if (CLI_ARGS[ADD_FEE_EXCEPTION_CMD])
    return addFeeException(CLI_ARGS[DEPLOYED_ADDRESS_ARG], CLI_ARGS[ETH_ADDRESS_ARG])
  if (CLI_ARGS[REMOVE_FEE_EXCEPTION_CMD])
    return removeFeeException(CLI_ARGS[DEPLOYED_ADDRESS_ARG], CLI_ARGS[ETH_ADDRESS_ARG])
  if (CLI_ARGS[DEPLOY_SAFE_VAULT_CMD])
    return deploySafeVaultContract()
  if (CLI_ARGS[DEPLOY_FEE_CONTRACT_CMD]) {
    return deployFeeContract(
      CLI_ARGS[FEE_SINK_ADDRESS_ARG],
      CLI_ARGS[PEG_IN_BASIS_POINTS_ARG],
      CLI_ARGS[PEG_OUT_BASIS_POINTS_ARG]
    )
  }
  if (CLI_ARGS[VERIFY_FEE_CONTRACT_CMD]) {
    return verifyFeeContract(
      CLI_ARGS[DEPLOYED_ADDRESS_ARG],
      CLI_ARGS[NETWORK_ARG],
      CLI_ARGS[FEE_SINK_ADDRESS_ARG],
      CLI_ARGS[PEG_IN_BASIS_POINTS_ARG],
      CLI_ARGS[PEG_OUT_BASIS_POINTS_ARG]
    )
  }
}

main().catch(_err => console.error('✘', _err.message))
