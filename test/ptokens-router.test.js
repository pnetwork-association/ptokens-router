const assert = require('assert')
const PTOKENS_ROUTER_ARTIFACT = artifacts.require('PTokensRouter')

contract('pTokens Router', ([OWNER, ...accounts]) => {
  let METHODS
  const SAMPLE_USER_DATA = '0xd3caff'
  const SAMPLE_METADATA_VERSION = '0x01'
  const SAMPLE_METADATA_CHAIN_ID = '0x00f34368' // NOTE: Rinkeby
  const SAMPLE_ETH_ADDRESS = '0xfEDFe2616EB3661CB8FEd2782F5F0cC91D59DCaC'

  const getContract = (_web3, _artifact, _constructorParams = []) =>
    new Promise((resolve, reject) =>
      _artifact
        .new(..._constructorParams)
        .then(({ contract: { _jsonInterface, _address } }) => resolve(new _web3.eth.Contract(_jsonInterface, _address)))
        .catch(reject)
    )

  const encodeCoreMetadata = (_web3, _metadataVersion, _userData, _protocolId, _originAddress) => {
    const METADATA_PARAMS = ['bytes1', 'bytes', 'bytes4', 'address']
    return _web3.eth.abi.encodeParameters(
      METADATA_PARAMS,
      [_metadataVersion, _userData, _protocolId, _originAddress]
    )
  }

  const encodeUserData = (_web3, _destinationAddress, _destinationChainId) => {
    const USER_DATA_PARAMS = ['bytes4', 'address']
    return _web3.eth.abi.encodeParameters(
      USER_DATA_PARAMS,
      [_destinationAddress, _destinationChainId]
    )
  }

  const getSampleMetadata = _web3 =>
    encodeCoreMetadata(_web3, '0x01', '0xd3caff', SAMPLE_METADATA_CHAIN_ID, SAMPLE_ETH_ADDRESS)

  const getSampleUserData = _web3 =>
    encodeUserData(_web3, SAMPLE_METADATA_CHAIN_ID, SAMPLE_ETH_ADDRESS)

  beforeEach(async () => {
    const routerContract = await getContract(web3, PTOKENS_ROUTER_ARTIFACT)
    METHODS = routerContract.methods
  })

  it('Should encode metadata', () => {
    const result = encodeCoreMetadata(
      web3,
      SAMPLE_METADATA_VERSION,
      SAMPLE_USER_DATA,
      SAMPLE_METADATA_CHAIN_ID,
      SAMPLE_ETH_ADDRESS,
    )
    /* eslint-disable-next-line max-len */
    const expectedResult = '0x0100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000f3436800000000000000000000000000000000000000000000000000000000000000000000000000000000fedfe2616eb3661cb8fed2782f5f0cc91d59dcac0000000000000000000000000000000000000000000000000000000000000003d3caff0000000000000000000000000000000000000000000000000000000000'
    assert.strictEqual(result, expectedResult)
  })

  it('Should encode user data', () => {
    const result = encodeUserData(
      web3,
      SAMPLE_METADATA_CHAIN_ID,
      SAMPLE_ETH_ADDRESS,
    )
    /* eslint-disable-next-line max-len */
    const expectedResult = '0x00f3436800000000000000000000000000000000000000000000000000000000000000000000000000000000fedfe2616eb3661cb8fed2782f5f0cc91d59dcac'
    assert.strictEqual(result, expectedResult)
  })

  it('Should decode metadata...', async () => {
    const result = await METHODS.decodeMetadata(getSampleMetadata(web3)).call()
    assert.strictEqual(result.metadataVersion, SAMPLE_METADATA_VERSION)
    assert.strictEqual(result.userData, SAMPLE_USER_DATA)
    assert.strictEqual(result.originChainId,  SAMPLE_METADATA_CHAIN_ID)
    assert.strictEqual(result.originAddress, SAMPLE_ETH_ADDRESS)
  })

  it('Should decode userdata to destination chain and address...', async () => {
    const result = await METHODS.decodeUserDataToDestinationChainAndAddress(getSampleUserData(web3)).call()
    assert.strictEqual(result.destinationChain, SAMPLE_METADATA_CHAIN_ID)
    assert.strictEqual(result.destinationAddress, SAMPLE_ETH_ADDRESS)
  })
})
