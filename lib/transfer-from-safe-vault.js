const { getSafeVaultContractAndCallFunctionAndAwaitReceipt } = require('./contract-utils')

module.exports.transferFromSafeVault = (_deployedAddress, _tokenAddress, _destinationAddres, _tokenAmount) =>
  getSafeVaultContractAndCallFunctionAndAwaitReceipt(
    `✔ Transferring ${_tokenAmount} tokens @ ${_tokenAddress} to ${_destinationAddres}...`,
    _deployedAddress,
    'transfer',
    [ _tokenAddress, _destinationAddres, _tokenAmount ],
  )
