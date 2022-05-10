const {
  ZERO_ADDRESS,
  NON_ADMIN_ERROR,
  getRandomAddress,
  deployRouterContract,
  SAMPLE_SAFE_VAULT_ADDRESS,
  SAMPLE_METADATA_CHAIN_ID_1,
  SAMPLE_METADATA_CHAIN_ID_2,
} = require('./test-utils')
const assert = require('assert')

describe('Fees Tests', () => {
  let ROUTER_CONTRACT, NON_ADMIN, NON_ADMIN_ROUTER_CONTRACT, OWNER

  const PEG_IN_BASIS_POINTS = 666
  const PEG_OUT_BASIS_POINTS = 1337
  const FEE_BASIS_POINTS_DIVISOR = 10000
  const TOKEN_ADDRESS = getRandomAddress(ethers)
  const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000'

  beforeEach(async () => {
    const signers = await ethers.getSigners()
    OWNER = signers[0]
    NON_ADMIN = signers[1]
    ROUTER_CONTRACT = await deployRouterContract([ SAMPLE_SAFE_VAULT_ADDRESS ])
    NON_ADMIN_ROUTER_CONTRACT = ROUTER_CONTRACT.connect(NON_ADMIN)
  })

  it('Should return zero fee basis points if no mapping set', async () => {
    const result = await ROUTER_CONTRACT.tokenFees(ZERO_ADDRESS)
    const expectedResult = ethers.BigNumber.from(0)
    assert(result.pegInBasisPoints.eq(expectedResult))
    assert(result.pegOutBasisPoints.eq(expectedResult))
  })

  it('Fee basis points divisor should be 10,000', async () => {
    const result = await ROUTER_CONTRACT.FEE_BASIS_POINTS_DIVISOR()
    const expectedResult = ethers.BigNumber.from(FEE_BASIS_POINTS_DIVISOR)
    assert(result.eq(expectedResult))
  })

  it('Admin can set fees', async () => {
    await ROUTER_CONTRACT.setFees(TOKEN_ADDRESS, PEG_IN_BASIS_POINTS, PEG_OUT_BASIS_POINTS)
    const result = await ROUTER_CONTRACT.tokenFees(TOKEN_ADDRESS)
    assert(ethers.BigNumber.from(PEG_IN_BASIS_POINTS).eq(result.pegInBasisPoints))
    assert(ethers.BigNumber.from(PEG_OUT_BASIS_POINTS).eq(result.pegOutBasisPoints))
  })

  it('Non admin cannot set fees', async () => {
    try {
      await ROUTER_CONTRACT.connect(NON_ADMIN).setFees(TOKEN_ADDRESS, PEG_IN_BASIS_POINTS, PEG_OUT_BASIS_POINTS)
      assert.fail('Should not have resolved!')
    } catch (_err) {
      assert(_err.message.includes(NON_ADMIN_ERROR))
    }
  })

  it('Should sanity check basis points value')
})
