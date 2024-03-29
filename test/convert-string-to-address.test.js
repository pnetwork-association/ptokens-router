const assert = require('assert')
const { prop } = require('ramda')

describe('Convert String To Address Contract', () => {
  let CONTRACT, CONTRACT_FACTORY

  beforeEach(async () => {
    const CONTRACT_NAME = 'ConvertStringToAddress'
    CONTRACT_FACTORY = await ethers.getContractFactory(`contracts/${CONTRACT_NAME}.sol:${CONTRACT_NAME}`)
    CONTRACT = await CONTRACT_FACTORY.deploy()
  })

  it('Should convert string type to address correctly', async () => {
    const NUM_ADDRESSES = 20
    const getXRandomAddresses = _x =>
      new Array(_x).fill().map(_ => ethers.Wallet.createRandom().address)
    const addresses = getXRandomAddresses(NUM_ADDRESSES)
    const results = await Promise.all(addresses.map(_address => CONTRACT.convertStringToAddress(`${_address}`)))
    results.map((_result, _i) => assert.strictEqual(_result, prop(_i, addresses)))
  })
})
