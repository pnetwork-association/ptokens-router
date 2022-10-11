const {
  keys,
  curry,
  assoc,
  flatten,
} = require('ramda')
/* eslint-disable-next-line no-shadow */
const ethers = require('ethers')
const { getFeeContract } = require('./get-deployed-contract')
const { convertSnakeCaseStringToCamelCase } = require('./utils')
const { callReadOnlyFxnInContract } = require('./contract-utils')
const { convertSnakeCaseKeysInObjToCamelCase } = require('./utils')
const { getExistingVaultAddresses } = require('./get-vault-addresses')
const { getDeployedRouterContract } = require('./get-deployed-contract')
const { constants: { metadataChainIds, ZERO_ADDRESS } } = require('ptokens-utils')

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
const TOKEN_BALANCES_STATE_KEY = 'tokenBalances'
const ROUTER_ADDRESS_STATE_KEY = 'routerAddress'
const VAULT_NETWORKS_STATE_KEY = 'vaultNetworks'
const VAULT_ADDRESSES_STATE_KEY = 'vaultAddreses'
const TOKEN_CONTRACTS_STATE_KEY = 'tokenContracts'
const VAULT_CONTRACTS_STATE_KEY = 'vaultContracts'
const ROUTER_CONTRACT_STATE_KEY = 'routerContract'
const TOKEN_ADDRESSES_STATE_KEY = 'tokenAddresses'
const FEE_SINK_ADDRESS_STATE_KEY = 'feeSinkAddress'
const SUPPORTED_TOKENS_STATE_KEY = 'supportedTokens'
const GET_SUPPORTED_TOKENS_FXN = 'getSupportedTokens'
const FEE_SINK_BALANCES_STATE_KEY = 'feeSinkBalances'
const FEE_CONTRACT_STATE_STATE_KEY = 'feeContractState'
const FEE_SINK_ADDRESS_CONTRACT_KEY = 'FEE_SINK_ADDRESS'
const FEE_CONTRACT_ADDRESS_STATE_KEY = 'feeContractAddress'
const CHAIN_IDS_HEX = CHAIN_ID_NAMES.map(_key => metadataChainIds[ _key ])
const FEE_CONTRACT_STATE_VARIABLES = [
  'FEE_SINK_ADDRESS',
  'PEG_IN_BASIS_POINTS',
  'PEG_OUT_BASIS_POINTS',
  'MAX_FEE_BASIS_POINTS',
]
const getFeeContractAndAddToState = _state =>
  getFeeContract(_state[FEE_CONTRACT_ADDRESS_STATE_KEY], _state[WALLET_STATE_KEY])
    .then(_feeContract => assoc(FEE_CONTRACT_STATE_KEY, _feeContract, _state))

const getFeeContractStateAndAddToState = _state =>
  Promise.all(
    FEE_CONTRACT_STATE_VARIABLES
      .map(_var => callReadOnlyFxnInContract(_var, EMPTY_FXN_ARGS, _state[FEE_CONTRACT_STATE_KEY]))
  )
    .then(_res =>
      FEE_CONTRACT_STATE_VARIABLES
        .reduce((_obj, _variableName, _i) => {
          const key = convertSnakeCaseStringToCamelCase(_variableName)
          let value = _res[_i]
          if (value._isBigNumber === true)
            value = value.toString()

          return assoc(key, value, _obj)
        },
        {},
        )
    )
    .then(assoc('feeContractAddress', _state[FEE_CONTRACT_ADDRESS_STATE_KEY]))
    .then(assoc('feeSinkTokenBalances', _state[FEE_SINK_BALANCES_STATE_KEY]))
    .then(_feeContractState => assoc(FEE_CONTRACT_STATE_STATE_KEY, _feeContractState, _state))

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

const getTokenDetailsFromContract = _tokenContract =>
  Promise.all([
    _tokenContract[ TOKEN_NAME_FXN ](),
    _tokenContract[ TOKEN_SYMBOL_FXN ](),
    _tokenContract[ TOTAL_SUPPLY_FXN ](),
    _tokenContract[ ORIGIN_CHAIN_ID_FXN ]()
  ])
    .then(([ _name, _symbol, _totalSupply, _originChainIdHex ]) =>
      ({
        'name': normalizeName(_name),
        'address': _tokenContract.address,
        'symbol': normalizeSymbol(_symbol),
        'originChainId': _originChainIdHex,
        'totalSupply': _totalSupply.toString(),
        'originChain': getHumanReadableOriginChainIdFromHex(_originChainIdHex)
      })
    )

const getSupportedTokensFromVaultContract = _vaultContract =>
  _vaultContract[ GET_SUPPORTED_TOKENS_FXN ]()
    .then(_supportedTokens =>
      Promise.all(_supportedTokens.map(_tokenAddress => getErc777Contract(_vaultContract.signer, _tokenAddress)))
    )
    .then(_tokenContracts => Promise.all(_tokenContracts.map(getTokenDetailsFromContract)))

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
  Promise.all(_state[TOKEN_CONTRACTS_STATE_KEY].map(getTokenDetailsFromContract))
    .then(_tokenInfos => assoc(TOKEN_INFOS_STATE_KEY, _tokenInfos, _state))

const getFeeSinkAddressFromFeeContractAndAddToState = _state =>
  callReadOnlyFxnInContract(FEE_SINK_ADDRESS_CONTRACT_KEY, EMPTY_FXN_ARGS, _state[FEE_CONTRACT_STATE_KEY])
    // NOTE: The fee sink address may not be set in the fee contract yet, so let's return the zero address.
    .catch(_ => Promise.resolve(ZERO_ADDRESS))
    .then(_address => assoc(FEE_SINK_ADDRESS_STATE_KEY, _address, _state))

const getFeeSinkAddressTokenBalancesAndAddToState = _state =>
  Promise.all(
    _state[TOKEN_CONTRACTS_STATE_KEY]
      .map(_tokenContract =>
        callReadOnlyFxnInContract('balanceOf', [ _state[FEE_SINK_ADDRESS_STATE_KEY] ], _tokenContract)
      )
  )
    .then(_tokenBalances => _tokenBalances.map(_balance => _balance.toString()))
    .then(_tokenBalances => assoc(TOKEN_BALANCES_STATE_KEY, _tokenBalances, _state))

const prepareFeeSinkBalancesOutputAndAddToState = _state => {
  const output = _state[TOKEN_INFOS_STATE_KEY].map((_info, _i) => ({
    'symbol': _info.symbol,
    'address': _info.address,
    'balance': _state[TOKEN_BALANCES_STATE_KEY][_i],
  }))
    .reduce((_obj, _e, _i) => assoc(_e.symbol, { 'address': _e.address, 'balance': _e.balance }, _obj), {})

  return assoc(FEE_SINK_BALANCES_STATE_KEY, output, _state)
}

const prepareOutputAndPutInState = _state => {
  const output = assoc('feeContractInfo', _state[FEE_CONTRACT_STATE_STATE_KEY], _state[VAULT_INFO_STATE_KEY])
  return assoc(OUTPUT_STATE_KEY, output, _state)
}

const getRouterState = _routerAddress =>
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
    .then(getVaultInfoFromRouterAndAddToState)
    .then(getFeeContractAddressFromRouterAndAddToState)
    .then(getFeeContractAndAddToState)
    .then(getFeeSinkAddressFromFeeContractAndAddToState)
    .then(getFeeSinkAddressTokenBalancesAndAddToState)
    .then(prepareFeeSinkBalancesOutputAndAddToState)
    .then(getFeeContractStateAndAddToState)
    .then(prepareOutputAndPutInState)
    .then(_state => console.dir(_state[OUTPUT_STATE_KEY], { depth: null }))
    .catch(console.warn)

module.exports = { getRouterState }
