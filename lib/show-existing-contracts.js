const { keys } = require('ramda')

const EXISTING_LOGIC_CONTRACT_ADDRESSES = [
  {
    chain: 'interim',
    logic: '0x881ACb88408dbd39EfAE663882613E585D41Df8A',
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
