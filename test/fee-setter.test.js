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
    const FIXED_FEE = 1337
    const BASIS_POINTS = 666

    const FEES = {
      'fixedFee': FIXED_FEE,
      'basisPoints': BASIS_POINTS,
    }

    it('Only admin can set fees', async () => {
      const feesBefore = await FEES_CONTRACT.getFees(TOKEN_ADDRESS)
      feesBefore.map(_fee => {
        assert(_fee.fixedFee.eq(0))
        assert(_fee.basisPoints.eq(0))
      })
      await FEES_CONTRACT.setFees(TOKEN_ADDRESS, FEES, FEES, FEES, FEES)
      const feesAfter = await FEES_CONTRACT.getFees(TOKEN_ADDRESS)
      feesAfter.map(_fee => {
        assert(_fee.fixedFee.eq(FIXED_FEE))
        assert(_fee.basisPoints.eq(BASIS_POINTS))
      })
    })

    it('Non admin cannot set fees', async () => {
      const feesBefore = await FEES_CONTRACT.getFees(TOKEN_ADDRESS)
      feesBefore.map(_fee => {
        assert(_fee.fixedFee.eq(0))
        assert(_fee.basisPoints.eq(0))
      })
      try {
        await NON_ADMIN_FEES_CONTRACT.setFees(TOKEN_ADDRESS, FEES, FEES, FEES, FEES)
        assert.fail('Should not have succeeded!')
      } catch (_err) {
        assert(_err.message.includes(NON_ADMIN_ERROR))
        const feesAfter = await FEES_CONTRACT.getFees(TOKEN_ADDRESS)
        feesAfter.map(_fee => {
          assert(_fee.fixedFee.eq(0))
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
          assert(feesBefore.fixedFee.eq(0))
          assert(feesBefore.basisPoints.eq(0))
          await FEES_CONTRACT[`set${_fxnNamesuffix}`](TOKEN_ADDRESS, FEES)
          const feesAfter = await FEES_CONTRACT[`get${_fxnNamesuffix}`](TOKEN_ADDRESS)
          assert(feesAfter.fixedFee.eq(FIXED_FEE))
          assert(feesAfter.basisPoints.eq(BASIS_POINTS))
        })

        it(`Non admin cannot set ${_fxnNamesuffix}`, async () => {
          const feesBefore = await FEES_CONTRACT[`get${_fxnNamesuffix}`](TOKEN_ADDRESS)
          assert(feesBefore.fixedFee.eq(0))
          assert(feesBefore.basisPoints.eq(0))
          try {
            await NON_ADMIN_FEES_CONTRACT[`set${_fxnNamesuffix}`](TOKEN_ADDRESS, FEES)
            assert.fail('Should not have succeeded!')
          } catch (_err) {
            assert(_err.message.includes(NON_ADMIN_ERROR))
            const feesAfter = await FEES_CONTRACT[`get${_fxnNamesuffix}`](TOKEN_ADDRESS)
            assert(feesAfter.fixedFee.eq(0))
            assert(feesAfter.basisPoints.eq(0))
          }
        })
      })
    })
  })
})
