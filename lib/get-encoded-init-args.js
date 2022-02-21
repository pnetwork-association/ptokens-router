/* eslint-disable no-shadow  */
const ethers = require('ethers')
const { maybeStripHexPrefix } = require('./utils')

const encodeInitArgs = (_safeVaultAddress) => {
  console.info('✔ Encoding initialization arguments...')
  /* eslint-disable-next-line max-len */
  const abiFragment = 'function initialize(address _safeVaultAddress)'
  return Promise.resolve(
    new ethers.utils.Interface([ abiFragment ])
      .encodeFunctionData(
        'initialize',
        [ _safeVaultAddress ],
      )
  )
}

const getEncodedInitArgs = _safeVaultAddress =>
  encodeInitArgs(_safeVaultAddress)
    .then(maybeStripHexPrefix)
    .then(console.info)

module.exports = { getEncodedInitArgs }
