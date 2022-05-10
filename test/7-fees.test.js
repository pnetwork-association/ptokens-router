const {
  ZERO_ADDRESS,
  NON_ADMIN_ERROR,
  getRandomAddress,
  deployRouterContract,
  SAMPLE_SAFE_VAULT_ADDRESS,
} = require('./test-utils')
const assert = require('assert')

describe('Fees Tests', () => {
  let ROUTER_CONTRACT, NON_ADMIN, NON_ADMIN_ROUTER_CONTRACT

  const PEG_IN_BASIS_POINTS = 10
  const PEG_OUT_BASIS_POINTS = 25
  const MAX_FEE_BASIS_POINTS = 100
  const FEE_BASIS_POINTS_DIVISOR = 1e4
  const TOKEN_ADDRESS = getRandomAddress(ethers)

  const setMaxFeeBasisPointsInRouter = _routerContract =>
    _routerContract
      .setMaxFeeBasisPoints(MAX_FEE_BASIS_POINTS)
      .then(_ => ROUTER_CONTRACT.MAX_FEE_BASIS_POINTS())
      .then(_feeFromContract => assert(_feeFromContract.eq(ethers.BigNumber.from(MAX_FEE_BASIS_POINTS))))

  beforeEach(async () => {
    const signers = await ethers.getSigners()
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
    await setMaxFeeBasisPointsInRouter(ROUTER_CONTRACT)
    await ROUTER_CONTRACT.setFees(TOKEN_ADDRESS, PEG_IN_BASIS_POINTS, PEG_OUT_BASIS_POINTS)
    const result = await ROUTER_CONTRACT.tokenFees(TOKEN_ADDRESS)
    assert(ethers.BigNumber.from(PEG_IN_BASIS_POINTS).eq(result.pegInBasisPoints))
    assert(ethers.BigNumber.from(PEG_OUT_BASIS_POINTS).eq(result.pegOutBasisPoints))
  })

  it('Non admin cannot set fees', async () => {
    await setMaxFeeBasisPointsInRouter(ROUTER_CONTRACT)
    try {
      await NON_ADMIN_ROUTER_CONTRACT.setFees(TOKEN_ADDRESS, PEG_IN_BASIS_POINTS, PEG_OUT_BASIS_POINTS)
      assert.fail('Should not have resolved!')
    } catch (_err) {
      assert(_err.message.includes(NON_ADMIN_ERROR))
    }
  })

  it('Admin can change fee sink address', async () => {
    const feeSinkBefore = await ROUTER_CONTRACT.FEE_SINK_ADDRESS()
    assert.strictEqual(feeSinkBefore, ZERO_ADDRESS)
    await ROUTER_CONTRACT.setFeeSinkAddress(TOKEN_ADDRESS)
    const feeSinkAfter = await ROUTER_CONTRACT.FEE_SINK_ADDRESS()
    assert.strictEqual(feeSinkAfter, TOKEN_ADDRESS)
  })

  it('Non admin cannot change fee sink address', async () => {
    try {
      await NON_ADMIN_ROUTER_CONTRACT
        .setFeeSinkAddress(TOKEN_ADDRESS)
      assert.fail('Should not have resolved!')
    } catch (_err) {
      assert(_err.message.includes(NON_ADMIN_ERROR))
    }
  })

  it('Admin can change max fee basis points', async () => {
    const maxBasisPointsBefore = await ROUTER_CONTRACT.MAX_FEE_BASIS_POINTS()
    assert(maxBasisPointsBefore.eq(ethers.BigNumber.from(0)))
    await ROUTER_CONTRACT.setMaxFeeBasisPoints(PEG_IN_BASIS_POINTS)
    const maxBasisPointsAfter = await ROUTER_CONTRACT.MAX_FEE_BASIS_POINTS()
    assert(maxBasisPointsAfter.eq(ethers.BigNumber.from(PEG_IN_BASIS_POINTS)))
  })

  it('Non admin cannot change max fee basis points', async () => {
    try {
      await NON_ADMIN_ROUTER_CONTRACT
        .setMaxFeeBasisPoints(PEG_IN_BASIS_POINTS)
      assert.fail('Should not have resolved!')
    } catch (_err) {
      assert(_err.message.includes(NON_ADMIN_ERROR))
    }
  })

  it('Should calculate peg in fee', async () => {
    await setMaxFeeBasisPointsInRouter(ROUTER_CONTRACT)
    await ROUTER_CONTRACT.setFees(TOKEN_ADDRESS, PEG_IN_BASIS_POINTS, PEG_OUT_BASIS_POINTS)
    const isPegIn = true
    const amount = 1e6
    const result = await ROUTER_CONTRACT.calculateFee(TOKEN_ADDRESS, amount, isPegIn)
    const expectedFee = amount * PEG_IN_BASIS_POINTS / FEE_BASIS_POINTS_DIVISOR
    const expectedAmountMinusFee = amount - expectedFee
    assert(result.feeAmount.eq(ethers.BigNumber.from(expectedFee)))
    assert(result.amountMinusFee.eq(ethers.BigNumber.from(expectedAmountMinusFee)))
  })

  it('Should calculate peg out fee', async () => {
    await setMaxFeeBasisPointsInRouter(ROUTER_CONTRACT)
    await ROUTER_CONTRACT.setFees(TOKEN_ADDRESS, PEG_IN_BASIS_POINTS, PEG_OUT_BASIS_POINTS)
    const isPegIn = false
    const amount = 1e6
    const result = await ROUTER_CONTRACT.calculateFee(TOKEN_ADDRESS, amount, isPegIn)
    const expectedFee = amount * PEG_OUT_BASIS_POINTS / FEE_BASIS_POINTS_DIVISOR
    const expectedAmountMinusFee = amount - expectedFee
    assert(result.feeAmount.eq(ethers.BigNumber.from(expectedFee)))
    assert(result.amountMinusFee.eq(ethers.BigNumber.from(expectedAmountMinusFee)))
  })

  it('Should calculate fee correctly if basis points are zero or not set', async () => {
    const isPegIn = false
    const amount = 1e6
    const result = await ROUTER_CONTRACT.calculateFee(TOKEN_ADDRESS, amount, isPegIn)
    const expectedFee = 0
    const expectedAmountMinusFee = amount
    assert(result.feeAmount.eq(ethers.BigNumber.from(expectedFee)))
    assert(result.amountMinusFee.eq(ethers.BigNumber.from(expectedAmountMinusFee)))
  })

  it('Acceptable value should pass basis points sanity check', async () => {
    await setMaxFeeBasisPointsInRouter(ROUTER_CONTRACT)
    const amount = MAX_FEE_BASIS_POINTS - 1
    const result = await ROUTER_CONTRACT.sanityCheckBasisPoints(amount)
    assert(result.eq(ethers.BigNumber.from(amount)))
  })

  it('Unacceptable value should fail basis points sanity check', async () => {
    await setMaxFeeBasisPointsInRouter(ROUTER_CONTRACT)
    const amount = MAX_FEE_BASIS_POINTS + 1
    try {
      await ROUTER_CONTRACT.sanityCheckBasisPoints(amount)
      assert.fail('Should not have resolved!')
    } catch (_err) {
      const expectedErr = 'Basis points value exceeds maximum!'
      assert(_err.message.includes(expectedErr))
    }
  })
})
