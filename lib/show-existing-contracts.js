const { keys } = require('ramda')

const EXISTING_LOGIC_CONTRACT_ADDRESSES = {
  'ropsten': '0x6e6D3CF78D454C9494e5B82C787CE6a261BdE577',
}

const showExistingContractAddresses = _ =>
  new Promise(resolve =>
    keys(EXISTING_LOGIC_CONTRACT_ADDRESSES).length === 0
      ? resolve(console.info('✘ No existing deployed contract addresses yet!'))
      : resolve(console.table(EXISTING_LOGIC_CONTRACT_ADDRESSES))
  )

module.exports = { showExistingContractAddresses }
