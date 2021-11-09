const USER_DATA_PARAMS = ['bytes4', 'address']
const METADATA_PARAMS = ['bytes1', 'bytes', 'bytes4', 'address']

const encodeCoreMetadata = (_metadataVersion, _userData, _originChainId, _originAddress) => {
  return new ethers.utils.AbiCoder().encode(
    METADATA_PARAMS,
    [ _metadataVersion, _userData, _originChainId, _originAddress ],
  )
}

const encodeUserData = (_destinationChainId, _destinationAddress) => {
  return new ethers.utils.AbiCoder().encode(
    USER_DATA_PARAMS,
    [ _destinationChainId, _destinationAddress ]
  )
}

const encodeUserDataInMetadata = (
  _metadataVersion,
  _userData,
  _originChainId,
  _originAddress,
  _destinationAddress,
  _destinationChainId,
) =>
  encodeCoreMetadata(
    _metadataVersion,
    encodeUserData(_destinationChainId, _destinationAddress),
    _originChainId,
    _originAddress
  )

module.exports = {
  encodeUserDataInMetadata,
  encodeCoreMetadata,
  encodeUserData,
}
