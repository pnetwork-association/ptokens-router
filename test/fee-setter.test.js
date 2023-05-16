const {
  NON_ADMIN_ERROR,
  getRandomAddress,
  deployFeesContract,
} = require('./test-utils')
const assert = require('assert')

describe('Fees Setter Tests', () => {
  let NON_ADMIN, NON_ADMIN_FEES_CONTRACT, FEES_CONTRACT

  const PEG_IN_BASIS_POINTS = 10
  const PEG_OUT_BASIS_POINTS = 25
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

  describe('Admin fee setting tests', () => {
    const MULTIPLIER = 1337
    const BASIS_POINTS = 666

    const FEES = {
      'multiplier': MULTIPLIER,
      'basisPoints': BASIS_POINTS,
    }

    it('Only admin can set fees', async () => {
      const feesBefore = await FEES_CONTRACT.getFees(TOKEN_ADDRESS)
      feesBefore.map(_fee => {
        assert(_fee.multiplier.eq(0))
        assert(_fee.basisPoints.eq(0))
      })
      await FEES_CONTRACT.setFees(TOKEN_ADDRESS, FEES, FEES, FEES, FEES)
      const feesAfter = await FEES_CONTRACT.getFees(TOKEN_ADDRESS)
      feesAfter.map(_fee => {
        assert(_fee.multiplier.eq(MULTIPLIER))
        assert(_fee.basisPoints.eq(BASIS_POINTS))
      })
    })

    it('Non admin cannot set fees', async () => {
      const feesBefore = await FEES_CONTRACT.getFees(TOKEN_ADDRESS)
      feesBefore.map(_fee => {
        assert(_fee.multiplier.eq(0))
        assert(_fee.basisPoints.eq(0))
      })
      try {
        await NON_ADMIN_FEES_CONTRACT.setFees(TOKEN_ADDRESS, FEES, FEES, FEES, FEES)
        assert.fail('Should not have succeeded!')
      } catch (_err) {
        assert(_err.message.includes(NON_ADMIN_ERROR))
        const feesAfter = await FEES_CONTRACT.getFees(TOKEN_ADDRESS)
        feesAfter.map(_fee => {
          assert(_fee.multiplier.eq(0))
          assert(_fee.basisPoints.eq(0))
        })
      }
    })

    const FEE_SETTER_FXN_NAMES_SUFFIXES = [
      'HostToHostFees',
      'HostToNativeFees',
      'NativeToHostFees',
      'NativeToNativeFees',
    ]

    FEE_SETTER_FXN_NAMES_SUFFIXES.map(_fxnNamesuffix => {
      describe(`${_fxnNamesuffix} fee setting test`, () => {
        it(`Only admin can set ${_fxnNamesuffix}`, async () => {
          const feesBefore = await FEES_CONTRACT[`get${_fxnNamesuffix}`](TOKEN_ADDRESS)
          assert(feesBefore.multiplier.eq(0))
          assert(feesBefore.basisPoints.eq(0))
          await FEES_CONTRACT[`set${_fxnNamesuffix}`](TOKEN_ADDRESS, FEES)
          const feesAfter = await FEES_CONTRACT[`get${_fxnNamesuffix}`](TOKEN_ADDRESS)
          assert(feesAfter.multiplier.eq(MULTIPLIER))
          assert(feesAfter.basisPoints.eq(BASIS_POINTS))
        })

        it(`Non admin cannot set ${_fxnNamesuffix}`, async () => {
          const feesBefore = await FEES_CONTRACT[`get${_fxnNamesuffix}`](TOKEN_ADDRESS)
          assert(feesBefore.multiplier.eq(0))
          assert(feesBefore.basisPoints.eq(0))
          try {
            await NON_ADMIN_FEES_CONTRACT[`set${_fxnNamesuffix}`](TOKEN_ADDRESS, FEES)
            assert.fail('Should not have succeeded!')
          } catch (_err) {
            assert(_err.message.includes(NON_ADMIN_ERROR))
            const feesAfter = await FEES_CONTRACT[`get${_fxnNamesuffix}`](TOKEN_ADDRESS)
            assert(feesAfter.multiplier.eq(0))
            assert(feesAfter.basisPoints.eq(0))
          }
        })
      })
    })
  })

  describe('Exchange rate setting tests', () => {
    const EXCHANGE_RATE = 42
    const CHAIN_ID = 0xffffffff

    it('Admin can set fee multiplier', async () => {
      const multiplierBefore = await FEES_CONTRACT.USD_EXCHANGE_RATE(CHAIN_ID)
      assert(multiplierBefore.eq(0))
      await FEES_CONTRACT.setUsdExchangeRate(CHAIN_ID, EXCHANGE_RATE)
      const multiplierAfter = await FEES_CONTRACT.USD_EXCHANGE_RATE(CHAIN_ID)
      assert(multiplierAfter.eq(EXCHANGE_RATE))
    })

    it('Non admin cannot set exchange rate', async () => {
      const multiplierBefore = await FEES_CONTRACT.USD_EXCHANGE_RATE(CHAIN_ID)
      assert(multiplierBefore.eq(0))
      try {
        await NON_ADMIN_FEES_CONTRACT.setUsdExchangeRate(CHAIN_ID, EXCHANGE_RATE)
        assert.fail('Should not have succeeded!')
      } catch (_err) {
        assert(_err.message.includes(NON_ADMIN_ERROR))
        const multiplierAfter = await FEES_CONTRACT.USD_EXCHANGE_RATE(CHAIN_ID)
        assert(multiplierAfter.eq(0))
      }
    })
  })

  describe('Multipler setter tests', () => {
    const MULTIPLIER = 1337

    it('Admin can set fixed fee for all bridge crossings in one function call', async () => {
      const feesBefore = await FEES_CONTRACT.getFees(TOKEN_ADDRESS)
      feesBefore.map(_fee => {
        assert(_fee.multiplier.eq(0))
        assert(_fee.basisPoints.eq(0))
      })
      await FEES_CONTRACT.setMultiplierForToken(TOKEN_ADDRESS, MULTIPLIER)
      const feesAfter = await FEES_CONTRACT.getFees(TOKEN_ADDRESS)
      feesAfter.map(_fee => {
        assert(_fee.multiplier.eq(MULTIPLIER))
        assert(_fee.basisPoints.eq(0))
      })
    })

    it('Non admin cannot set fixed fee for all bridge crossings in one function call', async () => {
      const feesBefore = await FEES_CONTRACT.getFees(TOKEN_ADDRESS)
      feesBefore.map(_fee => {
        assert(_fee.multiplier.eq(0))
        assert(_fee.basisPoints.eq(0))
      })
      try {
        await NON_ADMIN_FEES_CONTRACT.setMultiplierForToken(TOKEN_ADDRESS, MULTIPLIER)
        assert.fail('Should not have succeeded!')
      } catch (_err) {
        assert(_err.message.includes(NON_ADMIN_ERROR))
        const feesAfter = await FEES_CONTRACT.getFees(TOKEN_ADDRESS)
        feesAfter.map(_fee => {
          assert(_fee.multiplier.eq(0))
          assert(_fee.basisPoints.eq(0))
        })
      }
    })
  })
})
