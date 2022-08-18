const {
  NON_ADMIN_ERROR,
  getRandomAddress,
  deployFeesContract,
} = require('./test-utils')
const assert = require('assert')

describe('Fees Contract Tests', () => {
  let NON_ADMIN, NON_ADMIN_FEES_CONTRACT, FEES_CONTRACT

  const PEG_IN_BASIS_POINTS = 10
  const PEG_OUT_BASIS_POINTS = 25
  const MAX_FEE_BASIS_POINTS = 100
  const FEE_BASIS_POINTS_DIVISOR = 1e4
  const TOKEN_ADDRESS = getRandomAddress(ethers)
  const FEE_SINK_ADDRESS = getRandomAddress(ethers)

  beforeEach(async () => {
    const signers = await ethers.getSigners()
    NON_ADMIN = signers[1]
    FEES_CONTRACT = await deployFeesContract(FEE_SINK_ADDRESS, PEG_IN_BASIS_POINTS, PEG_OUT_BASIS_POINTS)
    NON_ADMIN_FEES_CONTRACT = FEES_CONTRACT.connect(NON_ADMIN)
  })

  describe('Constructor Tests', () => {
    it('Should have set peg in basis points on deploy', async () => {
      const result = await FEES_CONTRACT.PEG_IN_BASIS_POINTS()
      assert(ethers.BigNumber.from(PEG_IN_BASIS_POINTS).eq(result))
    })

    it('Should have set peg out basis points on deploy', async () => {
      const result = await FEES_CONTRACT.PEG_OUT_BASIS_POINTS()
      assert(ethers.BigNumber.from(PEG_OUT_BASIS_POINTS).eq(result))
    })

    it('Should have set the fee sink address oin deployment', async () => {
      const result = await FEES_CONTRACT.FEE_SINK_ADDRESS()
      assert.strictEqual(result, FEE_SINK_ADDRESS)
    })
  })

  describe('Admin tests', () => {
    it('Only admin can set new fee sink address', async () => {
      const newFeeSinkAddress = getRandomAddress(ethers)
      const feeSinkAddressBefore = await FEES_CONTRACT.FEE_SINK_ADDRESS()
      assert.strictEqual(feeSinkAddressBefore, FEE_SINK_ADDRESS)
      await FEES_CONTRACT.setFeeSinkAddress(newFeeSinkAddress)
      const feeSinkAddressAfter = await FEES_CONTRACT.FEE_SINK_ADDRESS()
      assert.strictEqual(feeSinkAddressAfter, newFeeSinkAddress)
    })

    it('Non admin cannot set new fee sink address', async () => {
      const newFeeSinkAddress = getRandomAddress(ethers)
      const feeSinkAddressBefore = await FEES_CONTRACT.FEE_SINK_ADDRESS()
      assert.strictEqual(feeSinkAddressBefore, FEE_SINK_ADDRESS)
      try {
        await NON_ADMIN_FEES_CONTRACT.setFeeSinkAddress(newFeeSinkAddress)
        assert.fail('Should not have resolved!')
      } catch (_err) {
        assert(_err.message.includes(NON_ADMIN_ERROR))
        const feeSinkAddressAfter = await FEES_CONTRACT.FEE_SINK_ADDRESS()
        assert.strictEqual(feeSinkAddressAfter, FEE_SINK_ADDRESS)
      }
    })

    it('Admin can set max fee basis points', async () => {
      const maxFeeBasisPointsBefore = await FEES_CONTRACT.MAX_FEE_BASIS_POINTS()
      assert(maxFeeBasisPointsBefore.eq(MAX_FEE_BASIS_POINTS))
      const newMaxFeeBasisPoints = 1337
      await FEES_CONTRACT.setMaxFeeBasisPoints(newMaxFeeBasisPoints)
      const maxFeeBasisPointsAfter = await FEES_CONTRACT.MAX_FEE_BASIS_POINTS()
      assert(maxFeeBasisPointsAfter.eq(ethers.BigNumber.from(newMaxFeeBasisPoints)))
    })

    it('Non-admin cannot set max fee basis points', async () => {
      const maxFeeBasisPointsBefore = await FEES_CONTRACT.MAX_FEE_BASIS_POINTS()
      try {
        const newMaxFeeBasisPoints = 1337
        await NON_ADMIN_FEES_CONTRACT.setMaxFeeBasisPoints(newMaxFeeBasisPoints)
        assert.fail('Should not have resolved!')
      } catch (_err) {
        assert(_err.message.includes(NON_ADMIN_ERROR))
        const maxFeeBasisPointsAfter = await FEES_CONTRACT.MAX_FEE_BASIS_POINTS()
        assert(maxFeeBasisPointsAfter.eq(maxFeeBasisPointsBefore))
      }
    })

    it('Admin can change fee sink address', async () => {
      const feeSinkBefore = await FEES_CONTRACT.FEE_SINK_ADDRESS()
      assert.strictEqual(feeSinkBefore, FEE_SINK_ADDRESS)
      const newAddress = getRandomAddress(ethers)
      await FEES_CONTRACT.setFeeSinkAddress(newAddress)
      const feeSinkAfter = await FEES_CONTRACT.FEE_SINK_ADDRESS()
      assert.strictEqual(feeSinkAfter, newAddress)
    })

    it('Non admin cannot change fee sink address', async () => {
      try {
        await NON_ADMIN_FEES_CONTRACT
          .setFeeSinkAddress(TOKEN_ADDRESS)
        assert.fail('Should not have resolved!')
      } catch (_err) {
        assert(_err.message.includes(NON_ADMIN_ERROR))
      }
    })
  })

  describe('Basis Points Tests', () => {
    it('Acceptable value should pass basis points sanity check', async () => {
      const maxFeesBasisPoints = await FEES_CONTRACT.MAX_FEE_BASIS_POINTS()
      const amount = maxFeesBasisPoints - 1
      const result = await FEES_CONTRACT.sanityCheckBasisPoints(amount)
      assert(result.eq(ethers.BigNumber.from(amount)))
    })

    it('Unacceptable value should fail basis points sanity check', async () => {
      const maxFeesBasisPoints = await FEES_CONTRACT.MAX_FEE_BASIS_POINTS() + 1
      const amount = maxFeesBasisPoints + 1
      try {
        await FEES_CONTRACT.sanityCheckBasisPoints(amount)
        assert.fail('Should not have resolved!')
      } catch (_err) {
        const expectedErr = 'Basis points value exceeds maximum!'
        assert(_err.message.includes(expectedErr))
      }
    })

    it('Fee basis points divisor should be 10,000', async () => {
      const result = await FEES_CONTRACT.FEE_BASIS_POINTS_DIVISOR()
      const expectedResult = ethers.BigNumber.from(FEE_BASIS_POINTS_DIVISOR)
      assert(result.eq(expectedResult))
    })
  })

  describe('Fee calculation tests', () => {
    const AMOUNT = 1337e3

    describe('With peg in and out basis points == 0', () => {
      beforeEach(async () => {
        await FEES_CONTRACT.setPegInBasisPoints(0)
        await FEES_CONTRACT.setPegOutBasisPoints(0)
        const pegInBasisPoints = await FEES_CONTRACT.PEG_IN_BASIS_POINTS()
        assert(pegInBasisPoints.eq(0))
        const pegOutBasisPoints = await FEES_CONTRACT.PEG_OUT_BASIS_POINTS()
        assert(pegOutBasisPoints.eq(0))
      })

      it('Should calculate peg in fees correctly', async () => {
        const isPegin = true
        const { feeAmount, amountMinusFee } = await FEES_CONTRACT.calculateFee(isPegin, AMOUNT, TOKEN_ADDRESS)
        assert(feeAmount.eq(0))
        assert(amountMinusFee.eq(AMOUNT))
      })

      it('Should calculate peg out fees correctly', async () => {
        const isPegin = false
        const { feeAmount, amountMinusFee } = await FEES_CONTRACT.calculateFee(isPegin, AMOUNT, TOKEN_ADDRESS)
        assert(feeAmount.eq(0))
        assert(amountMinusFee.eq(AMOUNT))
      })
    })

    describe('With peg in and out basis points > 0', () => {
      beforeEach(async () => {
        const pegInBasisPoints = await FEES_CONTRACT.PEG_IN_BASIS_POINTS()
        assert(pegInBasisPoints.gt(0))
        const pegOutBasisPoints = await FEES_CONTRACT.PEG_OUT_BASIS_POINTS()
        assert(pegOutBasisPoints.gt(0))
      })

      describe('With NO fee exception set', () => {
        beforeEach(async () => {
          const tokenIsInExceptionList = await FEES_CONTRACT.FEE_EXPCEPTIONS[TOKEN_ADDRESS]
          assert(!tokenIsInExceptionList)
        })

        it('Should calculate peg in fees correctly', async () => {
          const isPegin = true
          const { feeAmount, amountMinusFee } = await FEES_CONTRACT.calculateFee(isPegin, AMOUNT, TOKEN_ADDRESS)
          const expectedFeeAmount = ethers
            .BigNumber
            .from(Math.floor(AMOUNT * PEG_IN_BASIS_POINTS / FEE_BASIS_POINTS_DIVISOR))
          const expectedAmountMinusFee = ethers.BigNumber.from(AMOUNT).sub(expectedFeeAmount)
          assert(feeAmount.eq(expectedFeeAmount))
          assert(amountMinusFee.eq(expectedAmountMinusFee))
        })

        it('Should calculate peg out fees correctly', async () => {
          const isPegin = false
          const { feeAmount, amountMinusFee } = await FEES_CONTRACT.calculateFee(isPegin, AMOUNT, TOKEN_ADDRESS)
          const expectedFeeAmount = ethers
            .BigNumber
            .from(Math.floor(AMOUNT * PEG_OUT_BASIS_POINTS / FEE_BASIS_POINTS_DIVISOR))
          const expectedAmountMinusFee = ethers.BigNumber.from(AMOUNT).sub(expectedFeeAmount)
          assert(feeAmount.eq(expectedFeeAmount))
          assert(amountMinusFee.eq(expectedAmountMinusFee))
        })
      })
    })
  })

  describe('Fee exceptions list tests', () => {
    it('Admin can add address to fee exceptions list', async () => {
      const address = getRandomAddress(ethers)
      const boolBefore = await FEES_CONTRACT.FEE_EXPCEPTIONS(address)
      assert(!boolBefore)
      await FEES_CONTRACT.addFeeException(address)
      const boolAfter = await FEES_CONTRACT.FEE_EXPCEPTIONS(address)
      assert(boolAfter)
    })

    it('Non admin cannot add address to fee exception list', async () => {
      const address = getRandomAddress(ethers)
      const boolBefore = await FEES_CONTRACT.FEE_EXPCEPTIONS(address)
      assert(!boolBefore)
      try {
        await NON_ADMIN_FEES_CONTRACT.addFeeException(address)
        assert.fail('Should not have resolved!')
      } catch (_err) {
        assert(_err.message.includes(NON_ADMIN_ERROR))
        const boolAfter = await FEES_CONTRACT.FEE_EXPCEPTIONS(address)
        assert(!boolAfter)
      }
    })

    it('Admin can remove address to fee exceptions list', async () => {
      const address = getRandomAddress(ethers)
      await FEES_CONTRACT.addFeeException(address)
      const boolBefore = await FEES_CONTRACT.FEE_EXPCEPTIONS(address)
      assert(boolBefore)
      await FEES_CONTRACT.removeFeeException(address)
      const boolAfter = await FEES_CONTRACT.FEE_EXPCEPTIONS(address)
      assert(!boolAfter)
    })

    it('Non admin cannot remove address to fee exception list', async () => {
      const address = getRandomAddress(ethers)
      await FEES_CONTRACT.addFeeException(address)
      const boolBefore = await FEES_CONTRACT.FEE_EXPCEPTIONS(address)
      assert(boolBefore)
      try {
        await NON_ADMIN_FEES_CONTRACT.removeFeeException(address)
        assert.fail('Should not have resolved!')
      } catch (_err) {
        assert(_err.message.includes(NON_ADMIN_ERROR))
        const boolAfter = await FEES_CONTRACT.FEE_EXPCEPTIONS(address)
        assert(boolAfter)
      }
    })
  })
})
