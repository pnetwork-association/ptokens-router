const METADATA_PARAMS = ['bytes1', 'bytes', 'bytes4', 'address']

// NOTE: v1!
const encodeCoreMetadata = (_metadataVersion, _userData, _originChainId, _originAddress) => {
  return new ethers.utils.AbiCoder().encode(
    METADATA_PARAMS,
    [ _metadataVersion, _userData, _originChainId, _originAddress ],
  )
}

module.exports = { encodeCoreMetadata }
