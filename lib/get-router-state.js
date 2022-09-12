const {
  keys,
  curry,
  assoc,
} = require('ramda')
/* eslint-disable-next-line no-shadow */
const ethers = require('ethers')
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

const getFeeContractAddressFromRouter = _routerContract =>
  _routerContract['FEE_CONTRACT_ADDRESS']()
    // NOTE: The fee contract address may not be set in the router yet, so let's return the zero address.
    .catch(_ => Promise.resolve(ZERO_ADDRESS))

const getVaultInfoFromRouter = _routerContract =>
  getExistingVaultAddresses(_routerContract)
    .then(_vaultAddressMap => {
      const vaultNetworks = keys(_vaultAddressMap)
      const vaultAddresses = vaultNetworks.map(_key => _vaultAddressMap[ _key ])
      return Promise.all([ vaultNetworks, getVaultContracts(_routerContract.signer, vaultAddresses) ])
    })
    .then(([ _vaultNetworks, _vaultContracts ]) => getVaultInfo(_vaultNetworks, _vaultContracts))

const getRouterState = _routerAddress =>
  getDeployedRouterContract(_routerAddress)
    .then(_routerContract =>
      Promise.all([ getVaultInfoFromRouter(_routerContract), getFeeContractAddressFromRouter(_routerContract) ])
    )
    .then(([ _vaultInfo, _feeContractAddress ]) =>
      console.dir(assoc('feeContractAddress', _feeContractAddress, _vaultInfo), { depth: null })
    )
    .catch(console.warn)

module.exports = { getRouterState }
