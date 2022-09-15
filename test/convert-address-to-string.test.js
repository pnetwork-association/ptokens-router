const assert = require('assert')
const { prop } = require('ramda')
const { getRandomAddress } = require('./test-utils')

describe('Convert Address To String Contract', () => {
  let CONTRACT, CONTRACT_FACTORY

  beforeEach(async () => {
    const CONTRACT_NAME = 'ConvertAddressToString'
    CONTRACT_FACTORY = await ethers.getContractFactory(`contracts/${CONTRACT_NAME}.sol:${CONTRACT_NAME}`)
    CONTRACT = await CONTRACT_FACTORY.deploy()
  })

  it('Should convert address type to string correctly', async () => {
    const NUM_ADDRESSES = 20
    const getXRandomAddresses = _x =>
      new Array(_x).fill().map(_ => getRandomAddress(ethers))
    const addresses = getXRandomAddresses(NUM_ADDRESSES)
    const results = await Promise.all(addresses.map(_address => CONTRACT.convertAddressToString(_address)))
    results.map((_result, _i) => assert.strictEqual(_result, prop(_i, addresses).toLowerCase()))
  })
})
