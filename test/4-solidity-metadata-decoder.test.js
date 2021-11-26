const {
  SAMPLE_USER_DATA,
  getSampleMetadata,
  getSampleUserData,
  SAMPLE_ETH_ADDRESS_1,
  SAMPLE_METADATA_VERSION,
  SAMPLE_METADATA_CHAIN_ID_1,
} = require('./test-utils')
const assert = require('assert')

describe('Metadata Decoder Contract', () => {
  let CONTRACT

  beforeEach(async () => {
    const contractPath = 'contracts/PTokensMetadataDecoder.sol:PTokensMetadataDecoder'
    const contractFactory = await ethers.getContractFactory(contractPath)
    CONTRACT = await upgrades.deployProxy(contractFactory, [])
  })

  it('Should decode metadata...', async () => {
    const result = await CONTRACT.decodeMetadata(getSampleMetadata())
    assert.strictEqual(result.userData, SAMPLE_USER_DATA)
    assert.strictEqual(result.originAddress, SAMPLE_ETH_ADDRESS_1)
    assert.strictEqual(result.metadataVersion, SAMPLE_METADATA_VERSION)
    assert.strictEqual(result.originChainId, SAMPLE_METADATA_CHAIN_ID_1)
  })

  it('Should decode userdata to destination chain and address...', async () => {
    const result = await CONTRACT.decodeUserDataToDestinationChainAndAddress(getSampleUserData())
    assert.strictEqual(result.destinationAddress, SAMPLE_ETH_ADDRESS_1)
    assert.strictEqual(result.destinationChain, SAMPLE_METADATA_CHAIN_ID_1)
  })
})
