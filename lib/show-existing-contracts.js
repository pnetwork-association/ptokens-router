const { keys } = require('ramda')

const EXISTING_LOGIC_CONTRACT_ADDRESSES = [
  {
    chain: 'interim',
    logic: '0xf566ef518Ea9A987a574Ccb62Ada762f52d727d4',
    impl: '0x54d5a0638f23f0b89053f86eed60237bbc56e98c'
  },
  {
    chain: 'ropsten',
    logic: '0xec1700a39972482d5db20e73bb3ffe6829b0c102',
    impl: '0x48d013a79ce2005f11bf940444bbe699cd3e5e22'
  },
]

const showExistingContractAddresses = _ =>
  new Promise(resolve =>
    keys(EXISTING_LOGIC_CONTRACT_ADDRESSES).length === 0
      ? resolve(console.info('✘ No existing deployed contract addresses yet!'))
      : resolve(console.table(EXISTING_LOGIC_CONTRACT_ADDRESSES))
  )

module.exports = { showExistingContractAddresses }
