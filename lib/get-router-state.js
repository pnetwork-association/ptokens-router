const {
  keys,
  prop,
  curry,
  assoc,
  flatten,
} = require('ramda')
/* eslint-disable-next-line no-shadow */
const ethers = require('ethers')
/* eslint-disable-next-line no-shadow */
const { FixedNumber } = require('ethers')
const { callReadOnlyFxnInContract } = require('./contract-utils')
const { convertSnakeCaseKeysInObjToCamelCase } = require('./utils')
const { getSafeVaultContract } = require('./get-deployed-contract')
const { getExistingVaultAddresses } = require('./get-vault-addresses')
const { getDeployedRouterContract } = require('./get-deployed-contract')
const { constants: { metadataChainIds, ZERO_ADDRESS } } = require('@pnetwork-association/ptokens-utils')

// TODO Remove the need to decrypt a private key for this CLI command!
// TODO Remove the need to decrypt the key twice due to getting the fee other contract!

const INITIAL_STATE = {}
const EMPTY_FXN_ARGS = []
const TOKEN_NAME_FXN = 'name'
const PNETWORK_FXN = 'PNETWORK'
const OUTPUT_STATE_KEY = 'output'
const WALLET_STATE_KEY = 'wallet'
const TOKEN_SYMBOL_FXN = 'symbol'
const TOTAL_SUPPLY_FXN = 'totalSupply'
const VAULT_INFO_STATE_KEY = 'vaultInfo'
const VAULT_DICTIONARY = 'vaultDictionary'
const TOKEN_INFOS_STATE_KEY = 'tokenInfos'
const FEE_CONTRACT_STATE_KEY = 'feeContract'
const ORIGIN_CHAIN_ID_FXN = 'ORIGIN_CHAIN_ID'
const CHAIN_ID_NAMES = keys(metadataChainIds)
const GLOBAL_MIN_FEE_STATE_KEY = 'globalMinFee'
const SAFE_VAULT_ADDRESS_STATE_KEY = 'safeVault'
const ROUTER_ADDRESS_STATE_KEY = 'routerAddress'
const VAULT_NETWORKS_STATE_KEY = 'vaultNetworks'
const VAULT_ADDRESSES_STATE_KEY = 'vaultAddreses'
const TOKEN_CONTRACTS_STATE_KEY = 'tokenContracts'
const VAULT_CONTRACTS_STATE_KEY = 'vaultContracts'
const ROUTER_CONTRACT_STATE_KEY = 'routerContract'
const TOKEN_ADDRESSES_STATE_KEY = 'tokenAddresses'
const SAFE_VAULT_STATE_STATE_KEY = 'safeVaultState'
const SUPPORTED_TOKENS_STATE_KEY = 'supportedTokens'
const GET_SUPPORTED_TOKENS_FXN = 'getSupportedTokens'
const CHAIN_MULTIPLIERS_STATE_KEY = 'chainMultipliers'
const TOKEN_FEE_SETTINGS_STATE_KEY = 'tokenFeeSettings'
const FEE_SINK_ADDRESSES_STATE_KEY = 'feeSinkAddresses'
const SAFE_VAULT_CONTRACT_STATE_KEY = 'safeVaultContract'
const FEE_CONTRACT_ADDRESS_STATE_KEY = 'feeContractAddress'
const SAFE_VAULT_CONTRACT_OWNER_STATE_KEY = 'safeVaultContractOwner'
const CHAIN_IDS_HEX = CHAIN_ID_NAMES.map(_key => metadataChainIds[ _key ])
const NETWORK_FEE_TOKEN_BALANCES_STATE_KEY = 'networkFeeTokenBalancesStateKey'
const SAFE_VAULT_CONTRACT_TOKEN_BALANCES_STATE_KEY = 'safeVaultContractTokenBalances'
const NODE_OPERATORS_FEE_TOKEN_BALANCES_STATE_KEY = 'nodeOperatorsFeeTokenBalancesStatekey'

const getSafeVaultContractAndAddToState = _state =>
  getSafeVaultContract(_state[SAFE_VAULT_ADDRESS_STATE_KEY], _state[WALLET_STATE_KEY])
    .then(_safeVaultContract => assoc(SAFE_VAULT_CONTRACT_STATE_KEY, _safeVaultContract, _state))

const getSafeVaultContractOwnerAndAddToState = _state =>
  callReadOnlyFxnInContract('owner', EMPTY_FXN_ARGS, _state[SAFE_VAULT_CONTRACT_STATE_KEY])
    .then(_owner => assoc(SAFE_VAULT_CONTRACT_OWNER_STATE_KEY, _owner, _state))
    .catch(_err => assoc(SAFE_VAULT_CONTRACT_OWNER_STATE_KEY, `✘ ${_err.message}`, _state))

const getSafeVaultContractStateAndAddToState = _state => {
  const safeVaultState = {
    safeVaultAddress: _state[SAFE_VAULT_ADDRESS_STATE_KEY],
    safeVaultOwner: _state[SAFE_VAULT_CONTRACT_OWNER_STATE_KEY],
    safeVaultTokenBalances: _state[SAFE_VAULT_CONTRACT_TOKEN_BALANCES_STATE_KEY]
  }

  return assoc(SAFE_VAULT_STATE_STATE_KEY, safeVaultState, _state)
}

const VAULT_ABI = [
  {
    'inputs': [],
    'name': GET_SUPPORTED_TOKENS_FXN,
    'outputs': [ { 'internalType': 'address[]', 'name': 'res', 'type': 'address[]' } ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': PNETWORK_FXN,
    'outputs': [ { 'internalType': 'address', 'name': '', 'type': 'address' } ],
    'stateMutability': 'view',
    'type': 'function'
  },
]

const ERC777_ABI = [
  {
    'inputs': [],
    'name': TOKEN_NAME_FXN,
    'outputs': [ { 'internalType': 'string', 'name': '', 'type': 'string' } ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': TOKEN_SYMBOL_FXN,
    'outputs': [ { 'internalType': 'string', 'name': '', 'type': 'string' } ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': ORIGIN_CHAIN_ID_FXN,
    'outputs': [ { 'internalType': 'bytes4', 'name': '', 'type': 'bytes4' } ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': TOTAL_SUPPLY_FXN,
    'outputs': [ { 'internalType': 'uint256', 'name': '', 'type': 'uint256' } ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [ { 'internalType': 'address', 'name': 'account', 'type': 'address' } ],
    'name': 'balanceOf',
    'outputs': [ { 'internalType': 'uint256', 'name': '', 'type': 'uint256' } ],
    'stateMutability': 'view',
    'type': 'function'
  },
]

const getHumanReadableOriginChainIdFromHex = _hex =>
  CHAIN_IDS_HEX
    .reduce((_acc, _chainIdHex, _i) => {
      /* eslint-disable-next-line no-param-reassign */
      if (_chainIdHex === _hex) _acc = CHAIN_ID_NAMES[_i]
      return _acc
    }, `Cannot find human readable name for origin chain id: ${_hex}`)

const getVaultContract = curry((_signer, _address) =>
  new ethers.Contract(_address, VAULT_ABI, _signer)
)

const getFeeContract = curry((_signer, _address) =>
  new ethers.Contract(_address, require('./abis/fee-contract-abi.json'), _signer)
)

const getErc777Contract = curry((_signer, _address) =>
  new ethers.Contract(_address, ERC777_ABI, _signer)
)

const getVaultContracts = (_signer, _addresses) =>
  _addresses.map(getVaultContract(_signer))

const normalizeSymbol = _symbol => {
  if (_symbol === '') {
    // NOTE This token symbol was set incorrectly upon deployment...
    return 'wFTM'
  } else if (_symbol.startsWith('pTokens ')) {
    // NOTE Some were set with their name as their symbol...
    return _symbol.split(' ')[1]
  } else {
    return _symbol
  }
}

const normalizeName = _name => {
  if (_name === '') {
    // NOTE This token symbol was set incorrectly upon deployment...
    return 'pTokens wFTM'
  } else if (!_name.toLowerCase().includes('ptokens')) {
    // NOTE Some were set with their symbol as their name...
    return `pTokens ${_name}`
  } else {
    return _name
  }
}

const getTokenDetailsFromContract = (_tokenContract, _maybeAddress = null) =>
  Promise.all([
    _tokenContract[ TOKEN_NAME_FXN ](),
    _tokenContract[ TOKEN_SYMBOL_FXN ](),
    _tokenContract[ TOTAL_SUPPLY_FXN ](),
    _tokenContract[ ORIGIN_CHAIN_ID_FXN ](),
    _maybeAddress !== null && _tokenContract[ 'balanceOf' ](_maybeAddress),
  ])
    .then(([ _name, _symbol, _totalSupply, _originChainIdHex, _maybeBalance ]) => {
      const result = {
        name: normalizeName(_name),
        address: _tokenContract.address,
        symbol: normalizeSymbol(_symbol),
        originChainId: _originChainIdHex,
        totalSupply: _totalSupply.toString(),
        originChain: getHumanReadableOriginChainIdFromHex(_originChainIdHex)
      }

      if (_maybeBalance === false)
        return result
      else
        return assoc('balance', _maybeBalance.toString(), result)
    })

const getSupportedTokensFromVaultContract = _vaultContract =>
  _vaultContract[ GET_SUPPORTED_TOKENS_FXN ]()
    .then(_supportedTokens =>
      Promise.all(_supportedTokens.map(_tokenAddress => getErc777Contract(_vaultContract.signer, _tokenAddress)))
    )
    .then(_tokenContracts =>
      Promise.all(
        _tokenContracts.map(_contract => getTokenDetailsFromContract(_contract, _vaultContract.address))
      )
    )

const getSupportedTokensFromVaultContracts = _vaultContracts =>
  Promise.all(_vaultContracts.map(getSupportedTokensFromVaultContract))

const getPNetworkAddressFromVaultContract = _vaultContract =>
  _vaultContract[PNETWORK_FXN]()

const getPNetworkAddressesFromVaultContracts = _vaultContracts =>
  Promise.all(_vaultContracts.map(getPNetworkAddressFromVaultContract))

// FIXME flatten this out too!
const getVaultInfo = (_vaultNetworks, _vaultContracts) =>
  Promise.all([
    getSupportedTokensFromVaultContracts(_vaultContracts),
    getPNetworkAddressesFromVaultContracts(_vaultContracts),
  ])
    .then(([ _arrOfSupportedTokens, _pNetworkAddresses ]) =>
      _arrOfSupportedTokens.reduce((_acc, _supportedTokensArr, _i) => {
        _acc[_vaultNetworks[_i]] = {
          'vaultAddress': _vaultContracts[_i].address,
          'pNetworkAddress': _pNetworkAddresses[_i],
          'supportedTokens': _supportedTokensArr,
        }
        return _acc
      }, {})
    )
    .then(convertSnakeCaseKeysInObjToCamelCase)

const getFeeContractAddressFromRouterAndAddToState = _state =>
  _state[ROUTER_CONTRACT_STATE_KEY]['FEE_CONTRACT_ADDRESS']()
    // NOTE: The fee contract address may not be set in the router yet, so let's return the zero address.
    .catch(_ => Promise.resolve(ZERO_ADDRESS))
    .then(_address => assoc(FEE_CONTRACT_ADDRESS_STATE_KEY, _address, _state))

const getSafeVaultContractAddressFromRouterAndAddToState = _state =>
  _state[ROUTER_CONTRACT_STATE_KEY]['SAFE_VAULT_ADDRESS']()
    // NOTE: The safe vault address may not be set in the router yet, so let's return the zero address.
    .catch(_ => Promise.resolve(ZERO_ADDRESS))
    .then(_address => assoc(SAFE_VAULT_ADDRESS_STATE_KEY, _address, _state))

const getVaultDictionaryFromRouterAndAddToState = _state =>
  getExistingVaultAddresses(_state[ROUTER_CONTRACT_STATE_KEY])
    .then(_vaultAddresses => assoc(VAULT_DICTIONARY, _vaultAddresses, _state))

const getVaultInfoFromRouterAndAddToState = _state =>
  getVaultInfo(_state[VAULT_NETWORKS_STATE_KEY], _state[VAULT_CONTRACTS_STATE_KEY])
    .then(_vaultInfo => assoc(VAULT_INFO_STATE_KEY, _vaultInfo, _state))

const getVaultContractsAndAddToState = _state =>
  assoc(
    VAULT_CONTRACTS_STATE_KEY,
    getVaultContracts(_state[ROUTER_CONTRACT_STATE_KEY].signer, _state[VAULT_ADDRESSES_STATE_KEY]),
    _state,
  )

const getDeployedRouterContractAndAddToState = _state =>
  getDeployedRouterContract(_state[ROUTER_ADDRESS_STATE_KEY])
    .then(_routerContract => assoc(ROUTER_CONTRACT_STATE_KEY, _routerContract, INITIAL_STATE))

const addRouterAddressToState = (_state, _routerAddress) =>
  Promise.resolve(assoc(ROUTER_ADDRESS_STATE_KEY, _routerAddress, _state))

const getVaultNetworksAndAddToState = _state =>
  assoc(VAULT_NETWORKS_STATE_KEY, keys(_state[VAULT_DICTIONARY]), _state)

const getVaultAddressesAndAddToState = _state => {
  const vaultAddresses = _state[VAULT_NETWORKS_STATE_KEY]
    .map(_key => _state[VAULT_DICTIONARY][ _key ])

  return assoc(VAULT_ADDRESSES_STATE_KEY, vaultAddresses, _state)
}

const getSupportedTokenAddressesFromVaultContractsAndAddToState = _state =>
  Promise.all(_state[VAULT_CONTRACTS_STATE_KEY].map(_vaultContract => _vaultContract[GET_SUPPORTED_TOKENS_FXN]()))
    .then(_supportedTokens => assoc(SUPPORTED_TOKENS_STATE_KEY, _supportedTokens, _state))

const getDedupedListOfSupportedTokensAndAddToState = _state => {
  const dedupedArray = [...new Set(flatten(_state[SUPPORTED_TOKENS_STATE_KEY]))]
  return assoc(TOKEN_ADDRESSES_STATE_KEY, dedupedArray, _state)
}

const getTokenContractsAndAddToState = _state =>
  Promise.all(_state[TOKEN_ADDRESSES_STATE_KEY].map(getErc777Contract(_state[WALLET_STATE_KEY])))
    .then(_tokenContracts => assoc(TOKEN_CONTRACTS_STATE_KEY, _tokenContracts, _state))

const getWalletAndAddToState = _state =>
  assoc(WALLET_STATE_KEY, _state[ROUTER_CONTRACT_STATE_KEY].signer, _state)

const getTokenInfosAndAddToState = _state =>
  Promise.all(_state[TOKEN_CONTRACTS_STATE_KEY].map(_contract => getTokenDetailsFromContract(_contract)))
    .then(_tokenInfos => assoc(TOKEN_INFOS_STATE_KEY, _tokenInfos, _state))

const getAllTokenBalances = (_tokenInfos, _tokenContracts, _address) =>
  Promise.all(_tokenContracts.map(_contract => callReadOnlyFxnInContract('balanceOf', [ _address ], _contract)))
    .then(_balances => _balances.reduce((_obj, _balance, _i) => {
      if (!_balance.eq(0)) {
        const balanceInfo = {
          balance: _balance.toString(),
          approxAmount: `≈${
            FixedNumber
              .fromString(_balance.toString())
              .divUnsafe(FixedNumber.fromString(`${1e18}`))
              .round(4)
          } ${_tokenInfos[_i].symbol}`,
          address: _tokenInfos[_i].address,
        }
        return assoc(_tokenInfos[_i].symbol, balanceInfo, _obj)
      } else {
        return _obj
      }
    }, {}))

const getSafeVaultTokenBalancesAndAddToState = _state =>
  getAllTokenBalances(
    _state[TOKEN_INFOS_STATE_KEY],
    _state[TOKEN_CONTRACTS_STATE_KEY],
    _state[SAFE_VAULT_ADDRESS_STATE_KEY]
  )
    .then(_balances => assoc(SAFE_VAULT_CONTRACT_TOKEN_BALANCES_STATE_KEY, _balances, _state))

const getNodeOperatorFeeSinkTokenBalancesAndAddToState = _state =>
  getAllTokenBalances(
    _state[TOKEN_INFOS_STATE_KEY],
    _state[TOKEN_CONTRACTS_STATE_KEY],
    _state[FEE_SINK_ADDRESSES_STATE_KEY].nodeOperatorsFeeSinkAddress
  )
    .then(_balances => assoc(NODE_OPERATORS_FEE_TOKEN_BALANCES_STATE_KEY, _balances, _state))

const getNetworkFeeSinkTokenBalancesAndAddToState = _state =>
  getAllTokenBalances(
    _state[TOKEN_INFOS_STATE_KEY],
    _state[TOKEN_CONTRACTS_STATE_KEY],
    _state[FEE_SINK_ADDRESSES_STATE_KEY].networkFeeSinkAddress
  )
    .then(_balances => assoc(NETWORK_FEE_TOKEN_BALANCES_STATE_KEY, _balances, _state))

const prepareOutputAndPutInState = _state => {
  const output = {
    'vaultInfo': _state[VAULT_INFO_STATE_KEY],
    'safeVaultInfo': _state[SAFE_VAULT_STATE_STATE_KEY],
    'feeInfo': {
      'tokenFeeSettings': _state[TOKEN_FEE_SETTINGS_STATE_KEY],
      'feeSinkAddresses': _state[FEE_SINK_ADDRESSES_STATE_KEY],
      'chainIdMultipliers': _state[CHAIN_MULTIPLIERS_STATE_KEY],
      'feeContractAddress': _state[FEE_CONTRACT_ADDRESS_STATE_KEY],
      'globalMinNodeOperatorFee': _state[GLOBAL_MIN_FEE_STATE_KEY],
      'networkFeeSinkTokenBalances': _state[NETWORK_FEE_TOKEN_BALANCES_STATE_KEY],
      'nodeOperatorFeeSinkTokenBalances': _state[NODE_OPERATORS_FEE_TOKEN_BALANCES_STATE_KEY],
    },
  }

  return assoc(OUTPUT_STATE_KEY, output, _state)
}

const getFeeContractAndAddToState = _state => {
  const c = getFeeContract(_state[WALLET_STATE_KEY], _state[FEE_CONTRACT_ADDRESS_STATE_KEY])
  return assoc(FEE_CONTRACT_STATE_KEY, c, _state)
}

const getTokenFeeSettings = _state => {
  const tokenInfos = _state[TOKEN_INFOS_STATE_KEY]
  const feeContract = _state[FEE_CONTRACT_STATE_KEY]

  const tokenNames = tokenInfos.map(prop('name'))
  const tokenAddresses = tokenInfos.map(prop('address'))

  const bpPromises = Promise.all(tokenAddresses.map(_address => feeContract.BASIS_POINTS(_address)))
  const erPromises = Promise.all(tokenAddresses.map(_address => feeContract.EXCHANGE_RATE(_address)))
  const mfPromises = Promise.all(tokenAddresses.map(_address => feeContract.MINIMUM_NODE_OPERATOR_FEE(_address)))

  return Promise.all([ bpPromises, erPromises, mfPromises ])
    .then(([ _bps, _ers, _mfs ]) =>
      _bps.reduce((_acc, _, _i) => {
        const bpsNormalized = {
          'hostToHost': _bps[_i].hostToHost,
          'hostToNative': _bps[_i].hostToNative,
          'nativeToHost': _bps[_i].nativeToHost,
          'nativeToNative': _bps[_i].nativeToNative,
        }

        _acc[tokenNames[_i]] = {
          'minFee': _mfs[_i].toString(),
          'basisPoints': bpsNormalized,
          'address': tokenAddresses[_i],
          'exchangeRate': _ers[_i].toString(),
        }
        return _acc
      }, {})
    )
    .then(_o => assoc(TOKEN_FEE_SETTINGS_STATE_KEY, _o, _state))
}

const getChainMultipliersAndAddToState = _state => {
  const feeContract = _state[FEE_CONTRACT_STATE_KEY]

  return Promise.all(CHAIN_IDS_HEX.map(_chainId => feeContract.MULTIPLIER(_chainId)))
    .then(_multipliers =>
      _multipliers.reduce((_acc, _, _i) => {
        const cid = CHAIN_IDS_HEX[_i]
        const key = `${getHumanReadableOriginChainIdFromHex(cid)} (${cid})`
        _acc[key] = _multipliers[_i].toString()
        return _acc
      }, {})
    )
    .then(_o => assoc(CHAIN_MULTIPLIERS_STATE_KEY, _o, _state))
}

const getGlobalNodeOperatorsMinFeeAndAddToState = _state =>
  _state[FEE_CONTRACT_STATE_KEY]
    .NODE_OPERATORS_MINIMUM_FEE_MULTIPLIER()
    .then(_v => assoc(GLOBAL_MIN_FEE_STATE_KEY, _v.toString(), _state))

const getFeeSinkAddressesAndAddToState = _state => {
  const feeContract = _state[FEE_CONTRACT_STATE_KEY]

  return Promise.all([ feeContract.NETWORK_FEE_SINK_ADDRESS(), feeContract.NODE_OPERATORS_FEE_SINK_ADDRESS() ])
    .then(([ _n, _o ]) =>
      assoc(FEE_SINK_ADDRESSES_STATE_KEY, { 'networkFeeSinkAddress': _n, 'nodeOperatorsFeeSinkAddress': _o }, _state)
    )
}

const getSupportedTokensList = _routerAddress =>
  addRouterAddressToState(INITIAL_STATE, _routerAddress)
    .then(getDeployedRouterContractAndAddToState)
    .then(getWalletAndAddToState)
    .then(getVaultDictionaryFromRouterAndAddToState)
    .then(getVaultNetworksAndAddToState)
    .then(getVaultAddressesAndAddToState)
    .then(getVaultContractsAndAddToState)
    .then(getSupportedTokenAddressesFromVaultContractsAndAddToState)
    .then(getDedupedListOfSupportedTokensAndAddToState)
    .then(getTokenContractsAndAddToState)
    .then(getTokenInfosAndAddToState)

const getRouterState = _routerAddress =>
  getSupportedTokensList(_routerAddress)
    .then(getVaultInfoFromRouterAndAddToState)
    .then(getFeeContractAddressFromRouterAndAddToState)
    .then(getFeeContractAndAddToState)
    .then(getTokenFeeSettings)
    .then(getFeeSinkAddressesAndAddToState)
    .then(getNetworkFeeSinkTokenBalancesAndAddToState)
    .then(getNodeOperatorFeeSinkTokenBalancesAndAddToState)
    .then(getChainMultipliersAndAddToState)
    .then(getGlobalNodeOperatorsMinFeeAndAddToState)
    .then(getSafeVaultContractAddressFromRouterAndAddToState)
    .then(getSafeVaultContractAndAddToState)
    .then(getSafeVaultTokenBalancesAndAddToState)
    .then(getSafeVaultContractOwnerAndAddToState)
    .then(getSafeVaultContractStateAndAddToState)
    .then(prepareOutputAndPutInState)
    .then(_state => console.dir(_state[OUTPUT_STATE_KEY], { depth: null }))
    .catch(console.warn)

const getSupportedTokens = _routerAddress =>
  getSupportedTokensList(_routerAddress)
    .then(_state => console.dir(_state[TOKEN_INFOS_STATE_KEY], { depth: null }))
    .catch(console.warn)

module.exports = {
  getRouterState,
  getSupportedTokens,
}
