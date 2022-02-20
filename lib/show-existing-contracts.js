const { keys } = require('ramda')

const EXISTING_LOGIC_CONTRACT_ADDRESSES = {
  'interim': '0x136f85E126ccDf726E68ef14dDEd2ACeB37800E4',
  'ropsten': '0x47A6995A82d6715b328Df05224D96C0A1CF0f101',
}

const showExistingContractAddresses = _ =>
  new Promise(resolve =>
    keys(EXISTING_LOGIC_CONTRACT_ADDRESSES).length === 0
      ? resolve(console.info('✘ No existing deployed contract addresses yet!'))
      : resolve(console.table(EXISTING_LOGIC_CONTRACT_ADDRESSES))
  )

module.exports = { showExistingContractAddresses }
