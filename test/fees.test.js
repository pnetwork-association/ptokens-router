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
  const NETWORK_FEE_SINK_ADDRESS = getRandomAddress(ethers)
  const NODE_OPERATORS_FEE_SINK_ADDRESS = getRandomAddress(ethers)

  beforeEach(async () => {
    const signers = await ethers.getSigners()
    NON_ADMIN = signers[1]
    FEES_CONTRACT = await deployFeesContract(
      NODE_OPERATORS_FEE_SINK_ADDRESS,
      NETWORK_FEE_SINK_ADDRESS,
      PEG_IN_BASIS_POINTS,
      PEG_OUT_BASIS_POINTS,
    )
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

    it('Should have set the node operators fee sink address on deployment', async () => {
      const result = await FEES_CONTRACT.NODE_OPERATORS_FEE_SINK_ADDRESS()
      assert.strictEqual(result, NODE_OPERATORS_FEE_SINK_ADDRESS)
    })

    it('Should have set the network fee sink address on deployment', async () => {
      const result = await FEES_CONTRACT.NETWORK_FEE_SINK_ADDRESS()
      assert.strictEqual(result, NETWORK_FEE_SINK_ADDRESS)
    })
  })

  describe('Admin tests', () => {
    it('Only admin can set node operators fee sink address', async () => {
      const newFeeSinkAddress = getRandomAddress(ethers)
      const feeSinkAddressBefore = await FEES_CONTRACT.NODE_OPERATORS_FEE_SINK_ADDRESS()
      assert.strictEqual(feeSinkAddressBefore, NODE_OPERATORS_FEE_SINK_ADDRESS)
      await FEES_CONTRACT.setNodeOperatorsFeeSinkAddress(newFeeSinkAddress)
      const feeSinkAddressAfter = await FEES_CONTRACT.NODE_OPERATORS_FEE_SINK_ADDRESS()
      assert.strictEqual(feeSinkAddressAfter, newFeeSinkAddress)
    })

    it('Only admin can set network fee sink address', async () => {
      const newFeeSinkAddress = getRandomAddress(ethers)
      const feeSinkAddressBefore = await FEES_CONTRACT.NETWORK_FEE_SINK_ADDRESS()
      assert.strictEqual(feeSinkAddressBefore, NETWORK_FEE_SINK_ADDRESS)
      await FEES_CONTRACT.setNetworkFeeSinkAddress(newFeeSinkAddress)
      const feeSinkAddressAfter = await FEES_CONTRACT.NETWORK_FEE_SINK_ADDRESS()
      assert.strictEqual(feeSinkAddressAfter, newFeeSinkAddress)
    })

    it('Non admin cannot set node operators fee sink address', async () => {
      const newFeeSinkAddress = getRandomAddress(ethers)
      const feeSinkAddressBefore = await FEES_CONTRACT.NODE_OPERATORS_FEE_SINK_ADDRESS()
      assert.strictEqual(feeSinkAddressBefore, NODE_OPERATORS_FEE_SINK_ADDRESS)
      try {
        await NON_ADMIN_FEES_CONTRACT.setNodeOperatorsFeeSinkAddress(newFeeSinkAddress)
        assert.fail('Should not have resolved!')
      } catch (_err) {
        assert(_err.message.includes(NON_ADMIN_ERROR))
        const feeSinkAddressAfter = await FEES_CONTRACT.NODE_OPERATORS_FEE_SINK_ADDRESS()
        assert.strictEqual(feeSinkAddressAfter, NODE_OPERATORS_FEE_SINK_ADDRESS)
      }
    })

    it('Non admin cannot set network fee sink address', async () => {
      const newFeeSinkAddress = getRandomAddress(ethers)
      const feeSinkAddressBefore = await FEES_CONTRACT.NETWORK_FEE_SINK_ADDRESS()
      assert.strictEqual(feeSinkAddressBefore, NETWORK_FEE_SINK_ADDRESS)
      try {
        await NON_ADMIN_FEES_CONTRACT.setNetworkFeeSinkAddress(newFeeSinkAddress)
        assert.fail('Should not have resolved!')
      } catch (_err) {
        assert(_err.message.includes(NON_ADMIN_ERROR))
        const feeSinkAddressAfter = await FEES_CONTRACT.NETWORK_FEE_SINK_ADDRESS()
        assert.strictEqual(feeSinkAddressAfter, NETWORK_FEE_SINK_ADDRESS)
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
      const feeSinkBefore = await FEES_CONTRACT.NODE_OPERATORS_FEE_SINK_ADDRESS()
      assert.strictEqual(feeSinkBefore, NODE_OPERATORS_FEE_SINK_ADDRESS)
      const newAddress = getRandomAddress(ethers)
      await FEES_CONTRACT.setNodeOperatorsFeeSinkAddress(newAddress)
      const feeSinkAfter = await FEES_CONTRACT.NODE_OPERATORS_FEE_SINK_ADDRESS()
      assert.strictEqual(feeSinkAfter, newAddress)
    })

    it('Non admin cannot change fee sink address', async () => {
      try {
        await NON_ADMIN_FEES_CONTRACT
          .setNodeOperatorsFeeSinkAddress(TOKEN_ADDRESS)
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

  describe('Setting custom fees tests', () => {
    const CUSTOM_FEE = 1337

    it('Only admin can set custom peg in fees', async () => {
      const address = getRandomAddress(ethers)
      const customFeeBefore = await FEES_CONTRACT.CUSTOM_PEG_IN_FEES(address)
      assert(customFeeBefore.eq(0))
      await FEES_CONTRACT.setCustomPegInFee(address, CUSTOM_FEE)
      const customFeeAfter = await FEES_CONTRACT.CUSTOM_PEG_IN_FEES(address)
      assert(customFeeAfter.eq(CUSTOM_FEE))
    })

    it('Non admin cannot set custom peg in fees', async () => {
      const address = getRandomAddress(ethers)
      const customFeeBefore = await FEES_CONTRACT.CUSTOM_PEG_IN_FEES(address)
      assert(customFeeBefore.eq(0))
      try {
        await NON_ADMIN_FEES_CONTRACT.setCustomPegInFee(address, CUSTOM_FEE)
        assert.fail('Should not have succeeded!')
      } catch (_err) {
        assert(_err.message.includes(NON_ADMIN_ERROR))
        const customFeeAfter = await FEES_CONTRACT.CUSTOM_PEG_IN_FEES(address)
        assert(customFeeAfter.eq(0))
      }
    })

    it('Only admin can set custom peg out fees', async () => {
      const address = getRandomAddress(ethers)
      const customFeeBefore = await FEES_CONTRACT.CUSTOM_PEG_OUT_FEES(address)
      assert(customFeeBefore.eq(0))
      await FEES_CONTRACT.setCustomPegOutFee(address, CUSTOM_FEE)
      const customFeeAfter = await FEES_CONTRACT.CUSTOM_PEG_OUT_FEES(address)
      assert(customFeeAfter.eq(CUSTOM_FEE))
    })

    it('Non admin cannot set custom peg out fees', async () => {
      const address = getRandomAddress(ethers)
      const customFeeBefore = await FEES_CONTRACT.CUSTOM_PEG_IN_FEES(address)
      assert(customFeeBefore.eq(0))
      try {
        await NON_ADMIN_FEES_CONTRACT.setCustomPegOutFee(address, CUSTOM_FEE)
        assert.fail('Should not have succeeded!')
      } catch (_err) {
        assert(_err.message.includes(NON_ADMIN_ERROR))
        const customFeeAfter = await FEES_CONTRACT.CUSTOM_PEG_IN_FEES(address)
        assert(customFeeAfter.eq(0))
      }
    })
  })

  describe('Fee Basis Point Getter', () => {
    const CUSTOM_FEE = 1337
    const bools = [ false, true ]

    bools.map(_isPegIn =>
      describe(`For Peg ${_isPegIn ? 'Ins' : 'Outs'}`, () => {
        it(`Should use default peg ${_isPegIn ? 'in' : 'out'} basis points if no custom fee set`, async () => {
          const address = getRandomAddress(ethers)

          // NOTE: Assert there's no custom fee set
          const contractPegInDefaultFee = _isPegIn
            ? await FEES_CONTRACT.PEG_IN_BASIS_POINTS()
            : await FEES_CONTRACT.PEG_OUT_BASIS_POINTS()
          assert(contractPegInDefaultFee.eq(_isPegIn ? PEG_IN_BASIS_POINTS : PEG_OUT_BASIS_POINTS))

          // NOTE: Assert there's no fee exception set
          const customFee = _isPegIn
            ? await FEES_CONTRACT.CUSTOM_PEG_IN_FEES(address)
            : await FEES_CONTRACT.CUSTOM_PEG_OUT_FEES(address)
          assert(customFee.eq(0))

          // NOTE: Assert that we get the expected fee
          const expectedFee = _isPegIn
            ? await FEES_CONTRACT.PEG_IN_BASIS_POINTS()
            : await FEES_CONTRACT.PEG_OUT_BASIS_POINTS()
          const fee = await FEES_CONTRACT.getFeeBasisPoints(_isPegIn, address)
          assert(fee.eq(expectedFee))
        })

        it(`Should return custom peg ${_isPegIn ? 'in' : 'out'} basis points if set`, async () => {
          const address = getRandomAddress(ethers)

          // NOTE: Assert there's no custom fee set
          const contractPegInDefaultFee = _isPegIn
            ? await FEES_CONTRACT.PEG_IN_BASIS_POINTS()
            : await FEES_CONTRACT.PEG_OUT_BASIS_POINTS()
          assert(contractPegInDefaultFee.eq(_isPegIn ? PEG_IN_BASIS_POINTS : PEG_OUT_BASIS_POINTS))

          // NOTE: Assert there's no fee exception set
          const customFee = _isPegIn
            ? await FEES_CONTRACT.CUSTOM_PEG_IN_FEES(address)
            : await FEES_CONTRACT.CUSTOM_PEG_OUT_FEES(address)
          assert(customFee.eq(0))

          // NOTE Set a custom fee
          _isPegIn
            ? await FEES_CONTRACT.setCustomPegInFee(address, CUSTOM_FEE)
            : await FEES_CONTRACT.setCustomPegOutFee(address, CUSTOM_FEE)

          // NOTE: Assert that we get the expected fee
          const fee = await FEES_CONTRACT.getFeeBasisPoints(_isPegIn, address)
          assert(fee.eq(CUSTOM_FEE))
        })

        it(`Should allow a zero custom peg ${_isPegIn ? 'in' : 'out'} fee`, async () => {
          const zeroFee = 0
          const address = getRandomAddress(ethers)

          // NOTE: Assert there's no custom fee set
          const contractPegInDefaultFee = _isPegIn
            ? await FEES_CONTRACT.PEG_IN_BASIS_POINTS()
            : await FEES_CONTRACT.PEG_OUT_BASIS_POINTS()
          assert(contractPegInDefaultFee.eq(_isPegIn ? PEG_IN_BASIS_POINTS : PEG_OUT_BASIS_POINTS))

          // NOTE: Assert there's no fee exception set
          const customFee = _isPegIn
            ? await FEES_CONTRACT.CUSTOM_PEG_IN_FEES(address)
            : await FEES_CONTRACT.CUSTOM_PEG_OUT_FEES(address)
          assert(customFee.eq(0))

          // NOTE Set a zero fee for the target side we care about. See note in contract for the
          // perverse logic here.
          _isPegIn
            ? await FEES_CONTRACT.setCustomPegOutFee(address, PEG_OUT_BASIS_POINTS)
            : await FEES_CONTRACT.setCustomPegInFee(address, PEG_IN_BASIS_POINTS)

          // NOTE: Assert that we get the expected fee
          const fee = await FEES_CONTRACT.getFeeBasisPoints(_isPegIn, address)
          assert(fee.eq(zeroFee))
        })
      })
    )
  })
})
