const {
  EMPTY_DATA,
  SAMPLE_USER_DATA,
  SAMPLE_ETH_ADDRESS_1,
  SAMPLE_ETH_ADDRESS_2,
  SAMPLE_METADATA_CHAIN_ID_1,
  SAMPLE_METADATA_CHAIN_ID_2,
} = require('./test-utils')
const assert = require('assert')
const { encodeCoreMetadata } = require('../lib/metadata-encoder')

const getSampleCoreMetadataV1 = _ =>
  encodeCoreMetadata(
    SAMPLE_USER_DATA,
    SAMPLE_METADATA_CHAIN_ID_1,
    SAMPLE_ETH_ADDRESS_1
  )

const getSampleCoreMetadataV2 = _ =>
  encodeCoreMetadata(
    SAMPLE_USER_DATA,
    SAMPLE_METADATA_CHAIN_ID_1,
    SAMPLE_ETH_ADDRESS_1,
    SAMPLE_METADATA_CHAIN_ID_2,
    SAMPLE_ETH_ADDRESS_2,
  )

describe('Metadata Decoder Contract', () => {
  let CONTRACT

  beforeEach(async () => {
    const contractPath = 'contracts/PTokensMetadataDecoder.sol:PTokensMetadataDecoder'
    const contractFactory = await ethers.getContractFactory(contractPath)
    CONTRACT = await upgrades.deployProxy(contractFactory, [])
  })

  it('Should decode v1 metadata', async () => {
    const result = await CONTRACT.decodeMetadataV1(await getSampleCoreMetadataV1())
    assert.strictEqual(result.userData, SAMPLE_USER_DATA)
    assert.strictEqual(result.originAddress, SAMPLE_ETH_ADDRESS_1)
    assert.strictEqual(result.metadataVersion, '0x01')
    assert.strictEqual(result.originChainId, SAMPLE_METADATA_CHAIN_ID_1)
  })

  it('Should decode v2 metadata', async () => {
    const result = await CONTRACT.decodeMetadataV2(await getSampleCoreMetadataV2())
    assert.strictEqual(result.userData, SAMPLE_USER_DATA)
    assert.strictEqual(result.originAddress, SAMPLE_ETH_ADDRESS_1)
    assert.strictEqual(result.metadataVersion, '0x02')
    assert.strictEqual(result.originChainId, SAMPLE_METADATA_CHAIN_ID_1)
    assert.strictEqual(result.destinationChainId, SAMPLE_METADATA_CHAIN_ID_2)
    assert.strictEqual(result.destinationAddress, SAMPLE_ETH_ADDRESS_2)
    assert.strictEqual(result.protocolOptions, EMPTY_DATA)
    assert.strictEqual(result.protocolReceipt, EMPTY_DATA)
  })

  it('Should decode v3 metadata')
})
