const {
  SAMPLE_USER_DATA,
  SAMPLE_ETH_ADDRESS_1,
  SAMPLE_ETH_ADDRESS_2,
  SAMPLE_METADATA_CHAIN_ID_1,
  SAMPLE_METADATA_CHAIN_ID_2,
} = require('./test-utils')
const assert = require('assert')
const { silenceConsoleOutput } = require('./test-utils')
const { encodeCoreMetadata } = require('../lib/metadata-encoder')

describe('Metadata Encoder Contract', () => {
  silenceConsoleOutput()

  it('Should encode core metadata v1', async () => {
    const result = await encodeCoreMetadata(
      SAMPLE_USER_DATA,
      SAMPLE_METADATA_CHAIN_ID_1,
      SAMPLE_ETH_ADDRESS_1,
    )
    /* eslint-disable-next-line max-len */
    const expectedResult = '0x0100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000f3436800000000000000000000000000000000000000000000000000000000000000000000000000000000fedfe2616eb3661cb8fed2782f5f0cc91d59dcac0000000000000000000000000000000000000000000000000000000000000003d3caff0000000000000000000000000000000000000000000000000000000000'
    assert.strictEqual(result, expectedResult)
  })

  it('Should encode core metadata v2', async () => {
    const result = await encodeCoreMetadata(
      SAMPLE_USER_DATA,
      SAMPLE_METADATA_CHAIN_ID_1,
      SAMPLE_ETH_ADDRESS_1,
      SAMPLE_METADATA_CHAIN_ID_2,
      SAMPLE_ETH_ADDRESS_2,
    )
    /* eslint-disable-next-line max-len */
    const expectedResult = '0x0200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000f3436800000000000000000000000000000000000000000000000000000000000000000000000000000000fedfe2616eb3661cb8fed2782f5f0cc91d59dcac0069c32200000000000000000000000000000000000000000000000000000000000000000000000000000000edb86cd455ef3ca43f0e227e00469c3bdfa40628000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000000000000000000000000001600000000000000000000000000000000000000000000000000000000000000003d3caff000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
    assert.strictEqual(result, expectedResult)
  })

  it('Should encode core metadata v3', async () => {
    const result = await encodeCoreMetadata(
      SAMPLE_USER_DATA,
      SAMPLE_METADATA_CHAIN_ID_1,
      SAMPLE_ETH_ADDRESS_1,
      SAMPLE_METADATA_CHAIN_ID_2,
      SAMPLE_ETH_ADDRESS_2,
      '0x03'
    )
    /* eslint-disable-next-line max-len */
    const expectedResult = '0x0300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000f343680000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001400069c3220000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001a0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002200000000000000000000000000000000000000000000000000000000000000003d3caff0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002a30786645444665323631364542333636314342384645643237383246354630634339314435394443614300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002a3078656442383663643435356566336361343366306532323765303034363943336244464134303632380000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
    assert.strictEqual(result, expectedResult)
  })

  it('Should reject on unrecognized metadata version byte', async () => {
    try {
      await encodeCoreMetadata(
        SAMPLE_USER_DATA,
        SAMPLE_METADATA_CHAIN_ID_1,
        SAMPLE_ETH_ADDRESS_1,
        SAMPLE_METADATA_CHAIN_ID_2,
        SAMPLE_ETH_ADDRESS_2,
        'note a version byte!'
      )
      assert.fail('Should not have succeeded!')
    } catch (_err) {
      const expectedErr = 'Cannot encode core metadata!'
      assert(_err.message.includes(expectedErr))
    }
  })
})
