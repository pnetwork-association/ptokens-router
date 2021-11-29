const {
  SAMPLE_USER_DATA,
  getSampleV1Metadata,
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

  it('Should decode v1 metadata', async () => {
    const result = await CONTRACT.decodeMetadataV1(getSampleV1Metadata())
    assert.strictEqual(result.userData, SAMPLE_USER_DATA)
    assert.strictEqual(result.originAddress, SAMPLE_ETH_ADDRESS_1)
    assert.strictEqual(result.metadataVersion, SAMPLE_METADATA_VERSION)
    assert.strictEqual(result.originChainId, SAMPLE_METADATA_CHAIN_ID_1)
  })

  it('Should decode v2 metadata')
})
