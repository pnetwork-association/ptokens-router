const {
  SAMPLE_USER_DATA,
  getSampleMetadata,
  getSampleUserData,
  SAMPLE_ETH_ADDRESS_1,
  SAMPLE_METADATA_VERSION,
  SAMPLE_METADATA_CHAIN_ID_1,
} = require('./test-utils')
const assert = require('assert')

describe('pTokens Router Contract', () => {
  let OWNED_CONTRACT, CONTRACT_FACTORY, NON_OWNER, NON_OWNED_CONTRACT
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

  beforeEach(async () => {
    const ROUTER_CONTRACT_PATH = 'contracts/PTokensRouter.sol:PTokensRouter'
    const signers = await ethers.getSigners()
    NON_OWNER = signers[1]
    CONTRACT_FACTORY = await ethers.getContractFactory(ROUTER_CONTRACT_PATH)
    OWNED_CONTRACT = await upgrades.deployProxy(CONTRACT_FACTORY, [])
    NON_OWNED_CONTRACT = OWNED_CONTRACT.connect(NON_OWNER)
  })

  describe('Ownership tests...', () => {
    it('Owner can add vault addresses', async () => {
      const vaultAddressBefore = await OWNED_CONTRACT.vaultAddresses(SAMPLE_METADATA_CHAIN_ID_1)
      assert.strictEqual(vaultAddressBefore, ZERO_ADDRESS)
      await OWNED_CONTRACT.addVaultAddress(SAMPLE_METADATA_CHAIN_ID_1, SAMPLE_ETH_ADDRESS_1)
      const vaultAddressAfter = await OWNED_CONTRACT.vaultAddresses(SAMPLE_METADATA_CHAIN_ID_1)
      assert.strictEqual(vaultAddressAfter, SAMPLE_ETH_ADDRESS_1)
    })

    it('Non owner cannot add vault addresses', async () => {
      try {
        await NON_OWNED_CONTRACT.addVaultAddress(SAMPLE_METADATA_CHAIN_ID_1, SAMPLE_ETH_ADDRESS_1)
        assert.fail('Should not have succeeded!')
      } catch (_err) {
        const expectedErr = 'Ownable: caller is not the owner'
        assert(_err.message.includes(expectedErr))
      }
    })
  })

  describe('Metadata decoding tests...', () => {
    it('Should decode metadata...', async () => {
      const result = await OWNED_CONTRACT.decodeMetadata(getSampleMetadata())
      assert.strictEqual(result.userData, SAMPLE_USER_DATA)
      assert.strictEqual(result.originAddress, SAMPLE_ETH_ADDRESS_1)
      assert.strictEqual(result.metadataVersion, SAMPLE_METADATA_VERSION)
      assert.strictEqual(result.originChainId, SAMPLE_METADATA_CHAIN_ID_1)
    })

    it('Should decode userdata to destination chain and address...', async () => {
      const result = await OWNED_CONTRACT.decodeUserDataToDestinationChainAndAddress(getSampleUserData())
      assert.strictEqual(result.destinationAddress, SAMPLE_ETH_ADDRESS_1)
      assert.strictEqual(result.destinationChain, SAMPLE_METADATA_CHAIN_ID_1)
    })
  })
})
