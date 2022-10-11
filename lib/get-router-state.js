const {
  keys,
  curry,
  assoc,
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

const TOKEN_NAME_FXN = 'name'
const PNETWORK_FXN = 'PNETWORK'
const TOKEN_SYMBOL_FXN = 'symbol'
const TOTAL_SUPPLY_FXN = 'totalSupply'
const CHAIN_ID_NAMES = keys(metadataChainIds)
const ORIGIN_CHAIN_ID_FXN = 'ORIGIN_CHAIN_ID'
const GET_SUPPORTED_TOKENS_FXN = 'getSupportedTokens'
const CHAIN_IDS_HEX = CHAIN_ID_NAMES.map(_key => metadataChainIds[ _key ])

// FIXME
const INITIAL_ROUTER_STATE = {}
const ROUTER_CONTRACT_STATE_KEY = 'routerContract'
const VAULT_INFO_STATE_KEY = 'vaultInfo'
const ROUTER_ADDRESS_STATE_KEY = 'routerAddress'
const VAULT_ADDRESSES_STATE_KEY = 'vaultAddresses'
const FEE_CONTRACT_ADDRESS_STATE_KEY = 'feeContractAddress'
const FEE_CONTRACT_STATE_STATE_KEY = 'feeContractState'

// TODO Also remove the need to decrypt a private key for this CLI command!
// TODO Also remove the need to decrypt the key twice due to getting the fee other contract!

const EMPTY_FXN_ARGS = []

const FEE_CONTRACT_STATE_VARIABLES = [
  'FEE_SINK_ADDRESS',
  'PEG_IN_BASIS_POINTS',
  'PEG_OUT_BASIS_POINTS',
  'MAX_FEE_BASIS_POINTS',
]

const getFeeContractStateAndAddToState = _state =>
  getFeeContract(_state[FEE_CONTRACT_ADDRESS_STATE_KEY], _state[ROUTER_CONTRACT_STATE_KEY].signer)
    .then(_feeContract =>
      Promise.all(
        FEE_CONTRACT_STATE_VARIABLES.map(_var => callReadOnlyFxnInContract(_var, EMPTY_FXN_ARGS, _feeContract))
      )
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
    .then(_feeContractState => assoc(FEE_CONTRACT_STATE_STATE_KEY, _feeContractState, _state))

const VAULT_ABI = [
  {
    'inputs': [],
    'name': GET_SUPPORTED_TOKENS_FXN,
    'outputs': [
      {
        'internalType': 'address[]',
        'name': 'res',
        'type': 'address[]'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': PNETWORK_FXN,
    'outputs': [
      {
        'internalType': 'address',
        'name': '',
        'type': 'address'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
]

const ERC777_ABI = [{
  'inputs': [],
  'name': TOKEN_NAME_FXN,
  'outputs': [
    {
      'internalType': 'string',
      'name': '',
      'type': 'string'
    }
  ],
  'stateMutability': 'view',
  'type': 'function'
},
{
  'inputs': [],
  'name': TOKEN_SYMBOL_FXN,
  'outputs': [
    {
      'internalType': 'string',
      'name': '',
      'type': 'string'
    }
  ],
  'stateMutability': 'view',
  'type': 'function'
},
{
  'inputs': [],
  'name': ORIGIN_CHAIN_ID_FXN,
  'outputs': [
    {
      'internalType': 'bytes4',
      'name': '',
      'type': 'bytes4'
    }
  ],
  'stateMutability': 'view',
  'type': 'function'
},
{
  'inputs': [],
  'name': TOTAL_SUPPLY_FXN,
  'outputs': [
    {
      'internalType': 'uint256',
      'name': '',
      'type': 'uint256'
    }
  ],
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

const getTokenDetailsFromContract = _tokenContract =>
  Promise.all([
    _tokenContract[ TOKEN_NAME_FXN ](),
    _tokenContract[ TOKEN_SYMBOL_FXN ](),
    _tokenContract[ TOTAL_SUPPLY_FXN ](),
    _tokenContract[ ORIGIN_CHAIN_ID_FXN ]()
  ])
    .then(([ _name, _symbol, _totalSupply, _originChainIdHex ]) =>
      ({
        // NOTE: Because we forgot to set the name correctly for wFTM ipToken.
        'symbol': _name === '' && _symbol === '' ? 'wFTM' : _symbol,
        'name': _name === '' && _symbol === '' ? 'pTokens wFTM' : _name,
        'address': _tokenContract.address,
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

const getExistingVaultAddressesAndAddToState = _state =>
  getExistingVaultAddresses(_state[ROUTER_CONTRACT_STATE_KEY])
    .then(_vaultAddresses => assoc(VAULT_ADDRESSES_STATE_KEY, _vaultAddresses, _state))

const getVaultInfoFromRouterAndAddToState = _state => {
  const _vaultAddressMap = _state[VAULT_ADDRESSES_STATE_KEY]
  const vaultNetworks = keys(_vaultAddressMap)
  const vaultAddresses = vaultNetworks.map(_key => _vaultAddressMap[ _key ])
  return Promise.all([
    vaultNetworks,
    getVaultContracts(_state[ROUTER_CONTRACT_STATE_KEY].signer, vaultAddresses)
  ])
    .then(([ _vaultNetworks, _vaultContracts ]) => getVaultInfo(_vaultNetworks, _vaultContracts))
    .then(_vaultInfo => assoc(VAULT_INFO_STATE_KEY, _vaultInfo, _state))
}

const getDeployedRouterContractAndAddToState = _state =>
  getDeployedRouterContract(_state[ROUTER_ADDRESS_STATE_KEY])
    .then(_routerContract => assoc(ROUTER_CONTRACT_STATE_KEY, _routerContract, INITIAL_ROUTER_STATE))

const addRouterAddressToState = (_state, _routerAddress) =>
  Promise.resolve(assoc(ROUTER_ADDRESS_STATE_KEY, _routerAddress, _state))

const getRouterState = _routerAddress =>
  addRouterAddressToState(INITIAL_ROUTER_STATE, _routerAddress)
    .then(getDeployedRouterContractAndAddToState)
    .then(getExistingVaultAddressesAndAddToState)
    .then(getVaultInfoFromRouterAndAddToState)
    .then(getFeeContractAddressFromRouterAndAddToState)
    .then(getFeeContractStateAndAddToState)
    .then(_state =>
      console.dir(
        assoc('feeContractInfo', _state[FEE_CONTRACT_STATE_STATE_KEY], _state[VAULT_INFO_STATE_KEY]),
        { depth: null },
      )
    )
    .catch(console.warn)

module.exports = { getRouterState }
