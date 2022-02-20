const METADATA_VERSION_1_BYTE = '0x01'
const METADATA_VERSION_2_BYTE = '0x02'
const METADATA_VERSION_3_BYTE = '0x03'
const METADATA_PARAMS_V1 = ['bytes1', 'bytes', 'bytes4', 'address']
const METADATA_PARAMS_V2 = ['bytes1', 'bytes', 'bytes4', 'address', 'bytes4', 'address', 'bytes', 'bytes']
const METADATA_PARAMS_V3 = ['bytes1', 'bytes', 'bytes4', 'string', 'bytes4', 'string', 'bytes', 'bytes']

const encodeV1Metadata = (_codec, _userData, _originChainId, _originAddress) =>
  console.info('✔ Encoding v1 core metadata!') ||
  _codec.encode(METADATA_PARAMS_V1, [ METADATA_VERSION_1_BYTE, _userData, _originChainId, _originAddress ])

const encodeV2Metadata = (
  _codec,
  _userData,
  _originChainId,
  _originAddress,
  _destinationChainId,
  _destinationAddress,
  _protocolOptions,
  _protocolReceipt
) =>
  console.info('✔ Encoding v2 core metadata!') ||
  _codec.encode(
    METADATA_PARAMS_V2,
    [
      METADATA_VERSION_2_BYTE,
      _userData,
      _originChainId,
      _originAddress,
      _destinationChainId,
      _destinationAddress,
      _protocolOptions,
      _protocolReceipt,
    ]
  )

const encodeV3Metadata = (
  _codec,
  _userData,
  _originChainId,
  _originAddress,
  _destinationChainId,
  _destinationAddress,
  _protocolOptions,
  _protocolReceipt
) =>
  console.info('✔ Encoding v3 core metadata!') ||
  _codec.encode(
    METADATA_PARAMS_V3,
    [
      METADATA_VERSION_3_BYTE,
      _userData,
      _originChainId,
      _originAddress,
      _destinationChainId,
      _destinationAddress,
      _protocolOptions,
      _protocolReceipt,
    ]
  )

const encodeCoreMetadata = (
  _userData,
  _originChainId,
  _originAddress,
  _destinationChainId = null,
  _destinationAddress = null,
  _version = null,
  _protocolOptions = '0x',
  _protocolReceipt = '0x',
) =>
  new Promise((resolve, reject) => {
    const codec = new ethers.utils.AbiCoder()
    if (_destinationChainId === null) {
      resolve(encodeV1Metadata(codec, _userData, _originChainId, _originAddress))
    } else if (_version === null || _version === METADATA_VERSION_2_BYTE) {
      resolve(encodeV2Metadata(
        codec,
        _userData,
        _originChainId,
        _originAddress,
        _destinationChainId,
        _destinationAddress,
        _protocolOptions,
        _protocolReceipt
      ))
    } else if (_version === METADATA_VERSION_3_BYTE) {
      resolve(encodeV3Metadata(
        codec,
        _userData,
        _originChainId,
        _originAddress,
        _destinationChainId,
        _destinationAddress,
        _protocolOptions,
        _protocolReceipt
      ))
    } else {
      reject(new Error('Cannot encode core metadata!'))
    }
  })

module.exports = { encodeCoreMetadata }
