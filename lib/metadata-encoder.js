const METADATA_PARAMS_V1 = ['bytes1', 'bytes', 'bytes4', 'address']
const METADATA_PARAMS_V2 = ['bytes1', 'bytes', 'bytes4', 'address', 'bytes4', 'address', 'bytes', 'bytes']

const encodeCoreMetadata = (
  _userData,
  _originChainId,
  _originAddress,
  _destinationChainId = null,
  _destinationAddress = null,
  _protocolOptions = '0x',
  _protocolReceipt = '0x',
) => {
  const codec = new ethers.utils.AbiCoder()
  return _destinationChainId === null
    ? codec.encode(METADATA_PARAMS_V1, [ '0x01', _userData, _originChainId, _originAddress ])
    : codec.encode(
      METADATA_PARAMS_V2,
      [
        '0x02',
        _userData,
        _originChainId,
        _originAddress,
        _destinationChainId,
        _destinationAddress,
        _protocolOptions,
        _protocolReceipt,
      ]
    )
}

module.exports = { encodeCoreMetadata }
