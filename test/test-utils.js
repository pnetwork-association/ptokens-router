const {
  encodeUserData,
  encodeCoreMetadata,
} = require('../lib/metadata-encoder')
const SAMPLE_USER_DATA = '0xd3caff'
const SAMPLE_METADATA_VERSION = '0x01'
const SAMPLE_METADATA_CHAIN_ID_1 = '0x00f34368' // NOTE: Rinkeby
const SAMPLE_METADATA_CHAIN_ID_2 = '0x0069c322' // NOTE: Ropstennini
const SAMPLE_ETH_ADDRESS_1 = '0xfEDFe2616EB3661CB8FEd2782F5F0cC91D59DCaC'
const SAMPLE_ETH_ADDRESS_2 = '0xedB86cd455ef3ca43f0e227e00469C3bDFA40628'

const getSampleMetadata = _ =>
  encodeCoreMetadata('0x01', '0xd3caff', SAMPLE_METADATA_CHAIN_ID_1, SAMPLE_ETH_ADDRESS_1)

const getSampleUserData = _ =>
  encodeUserData(SAMPLE_METADATA_CHAIN_ID_1, SAMPLE_ETH_ADDRESS_1)

module.exports = {
  SAMPLE_METADATA_CHAIN_ID_1,
  SAMPLE_METADATA_CHAIN_ID_2,
  SAMPLE_METADATA_VERSION,
  SAMPLE_ETH_ADDRESS_1,
  SAMPLE_ETH_ADDRESS_2,
  getSampleMetadata,
  getSampleUserData,
  SAMPLE_USER_DATA,
}
