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

const METADATA_VERSION_3_BYTE = '0x03'

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

const getSampleCoreMetadataV3 = _ =>
  encodeCoreMetadata(
    SAMPLE_USER_DATA,
    SAMPLE_METADATA_CHAIN_ID_1,
    SAMPLE_ETH_ADDRESS_1,
    SAMPLE_METADATA_CHAIN_ID_2,
    SAMPLE_ETH_ADDRESS_2,
    METADATA_VERSION_3_BYTE,
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

  it('Should decode v3 metadata 1', async () => {
    const result = await CONTRACT.decodeMetadataV3(await getSampleCoreMetadataV3())
    assert.strictEqual(result.userData, SAMPLE_USER_DATA)
    assert.strictEqual(result.originAddress, SAMPLE_ETH_ADDRESS_1)
    assert.strictEqual(result.metadataVersion, METADATA_VERSION_3_BYTE)
    assert.strictEqual(result.originChainId, SAMPLE_METADATA_CHAIN_ID_1)
    assert.strictEqual(result.destinationChainId, SAMPLE_METADATA_CHAIN_ID_2)
    assert.strictEqual(result.destinationAddress, SAMPLE_ETH_ADDRESS_2)
    assert.strictEqual(result.protocolOptions, EMPTY_DATA)
    assert.strictEqual(result.protocolReceipt, EMPTY_DATA)
  })

  it('Should decode v3 metadata 2', async () => {
    // NOTE: Sample take from test in the core!
    /* eslint-disable-next-line max-len */
    const metadata = '0x0300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000f343680000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001400069c3220000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001a0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000000000000000000000000003d3caff0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002a30786645444665323631364542333636314342384645643237383246354630634339314435394443614300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002a3078656442383663643435356566336361343366306532323765303034363943336244464134303632380000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
    const result = await CONTRACT.decodeMetadataV3(metadata)
    assert.strictEqual(result.userData, SAMPLE_USER_DATA)
    assert.strictEqual(result.originAddress, SAMPLE_ETH_ADDRESS_1)
    assert.strictEqual(result.metadataVersion, METADATA_VERSION_3_BYTE)
    assert.strictEqual(result.originChainId, SAMPLE_METADATA_CHAIN_ID_1)
    assert.strictEqual(result.destinationChainId, SAMPLE_METADATA_CHAIN_ID_2)
    assert.strictEqual(result.destinationAddress, SAMPLE_ETH_ADDRESS_2)
    assert.strictEqual(result.protocolOptions, EMPTY_DATA)
    assert.strictEqual(result.protocolReceipt, EMPTY_DATA)
  })
})
