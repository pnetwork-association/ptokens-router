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
  let ROUTER_CONTRACT, CONTRACT_FACTORY, NON_OWNER, NON_OWNED_ROUTER_CONTRACT
  const NON_OWNER_ERROR = 'Ownable: caller is not the owner'
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

  beforeEach(async () => {
    const ROUTER_CONTRACT_PATH = 'contracts/PTokensRouter.sol:PTokensRouter'
    const signers = await ethers.getSigners()
    NON_OWNER = signers[1]
    CONTRACT_FACTORY = await ethers.getContractFactory(ROUTER_CONTRACT_PATH)
    ROUTER_CONTRACT = await upgrades.deployProxy(CONTRACT_FACTORY, [])
    NON_OWNED_ROUTER_CONTRACT = ROUTER_CONTRACT.connect(NON_OWNER)
  })

  describe('Ownership tests...', () => {
    it('Owner can add vault addresses', async () => {
      const vaultAddressBefore = await ROUTER_CONTRACT.vaultAddresses(SAMPLE_METADATA_CHAIN_ID_1)
      assert.strictEqual(vaultAddressBefore, ZERO_ADDRESS)
      await ROUTER_CONTRACT.addVaultAddress(SAMPLE_METADATA_CHAIN_ID_1, SAMPLE_ETH_ADDRESS_1)
      const vaultAddressAfter = await ROUTER_CONTRACT.vaultAddresses(SAMPLE_METADATA_CHAIN_ID_1)
      assert.strictEqual(vaultAddressAfter, SAMPLE_ETH_ADDRESS_1)
    })

    it('Owner can remove vault addresses', async () => {
      await ROUTER_CONTRACT.addVaultAddress(SAMPLE_METADATA_CHAIN_ID_1, SAMPLE_ETH_ADDRESS_1)
      const vaultAddressBefore = await ROUTER_CONTRACT.vaultAddresses(SAMPLE_METADATA_CHAIN_ID_1)
      assert.strictEqual(vaultAddressBefore, SAMPLE_ETH_ADDRESS_1)
      await ROUTER_CONTRACT.removeVaultAddress(SAMPLE_METADATA_CHAIN_ID_1)
      const vaultAddressAfter = await ROUTER_CONTRACT.vaultAddresses(SAMPLE_METADATA_CHAIN_ID_1)
      assert.strictEqual(vaultAddressAfter, ZERO_ADDRESS)
    })

    it('Non owner cannot add vault addresses', async () => {
      try {
        await NON_OWNED_ROUTER_CONTRACT.addVaultAddress(SAMPLE_METADATA_CHAIN_ID_1, SAMPLE_ETH_ADDRESS_1)
        assert.fail('Should not have succeeded!')
      } catch (_err) {
        assert(_err.message.includes(NON_OWNER_ERROR))
      }
    })

    it('Non owner cannot add vault addresses', async () => {
      ROUTER_CONTRACT.addVaultAddress(SAMPLE_METADATA_CHAIN_ID_1, SAMPLE_ETH_ADDRESS_1)
      assert.strictEqual(await ROUTER_CONTRACT.vaultAddresses(SAMPLE_METADATA_CHAIN_ID_1), SAMPLE_ETH_ADDRESS_1)
      try {
        await NON_OWNED_ROUTER_CONTRACT.removeVaultAddress(SAMPLE_METADATA_CHAIN_ID_1)
        assert.fail('Should not have succeeded!')
      } catch (_err) {
        assert(_err.message.includes(NON_OWNER_ERROR))
      }
      assert.strictEqual(await ROUTER_CONTRACT.vaultAddresses(SAMPLE_METADATA_CHAIN_ID_1), SAMPLE_ETH_ADDRESS_1)
    })
  })

  describe('Metadata decoding tests...', () => {
    it('Should decode metadata...', async () => {
      const result = await ROUTER_CONTRACT.decodeMetadata(getSampleMetadata())
      assert.strictEqual(result.userData, SAMPLE_USER_DATA)
      assert.strictEqual(result.originAddress, SAMPLE_ETH_ADDRESS_1)
      assert.strictEqual(result.metadataVersion, SAMPLE_METADATA_VERSION)
      assert.strictEqual(result.originChainId, SAMPLE_METADATA_CHAIN_ID_1)
    })

    it('Should decode userdata to destination chain and address...', async () => {
      const result = await ROUTER_CONTRACT.decodeUserDataToDestinationChainAndAddress(getSampleUserData())
      assert.strictEqual(result.destinationAddress, SAMPLE_ETH_ADDRESS_1)
      assert.strictEqual(result.destinationChain, SAMPLE_METADATA_CHAIN_ID_1)
    })
  })

  describe('Adding & Removing Vault Addresses', () => {
    it('Owner can add vault address', async () => {
      assert.strictEqual(await ROUTER_CONTRACT.vaultAddresses(SAMPLE_METADATA_CHAIN_ID_1), ZERO_ADDRESS)
      await ROUTER_CONTRACT.addVaultAddress(SAMPLE_METADATA_CHAIN_ID_1, SAMPLE_ETH_ADDRESS_1)
      assert.strictEqual(await ROUTER_CONTRACT.vaultAddresses(SAMPLE_METADATA_CHAIN_ID_1), SAMPLE_ETH_ADDRESS_1)
    })

    it('Non-owner cannot add vault address', async () => {
      assert.strictEqual(await ROUTER_CONTRACT.vaultAddresses(SAMPLE_METADATA_CHAIN_ID_1), ZERO_ADDRESS)
      try {
        await NON_OWNED_ROUTER_CONTRACT.addVaultAddress(SAMPLE_METADATA_CHAIN_ID_1, SAMPLE_ETH_ADDRESS_1)
        assert.fail('Should not have succeeded!')
      } catch (_err) {
        assert(_err.message.includes(NON_OWNER_ERROR))
      }
    })

    it('Owner can remove vault address', async () => {
      await ROUTER_CONTRACT.addVaultAddress(SAMPLE_METADATA_CHAIN_ID_1, SAMPLE_ETH_ADDRESS_1)
      assert.strictEqual(await ROUTER_CONTRACT.vaultAddresses(SAMPLE_METADATA_CHAIN_ID_1), SAMPLE_ETH_ADDRESS_1)
      await ROUTER_CONTRACT.removeVaultAddress(SAMPLE_METADATA_CHAIN_ID_1)
      assert.strictEqual(await ROUTER_CONTRACT.vaultAddresses(SAMPLE_METADATA_CHAIN_ID_1), ZERO_ADDRESS)
    })

    it('Non-owner cannot remove vault address', async () => {
      await ROUTER_CONTRACT.addVaultAddress(SAMPLE_METADATA_CHAIN_ID_1, SAMPLE_ETH_ADDRESS_1)
      assert.strictEqual(await ROUTER_CONTRACT.vaultAddresses(SAMPLE_METADATA_CHAIN_ID_1), SAMPLE_ETH_ADDRESS_1)
      try {
        await NON_OWNED_ROUTER_CONTRACT.removeVaultAddress(SAMPLE_METADATA_CHAIN_ID_1)
        assert.fail('Should not have succeeded!')
      } catch (_err) {
        assert(_err.message.includes(NON_OWNER_ERROR))
      }
    })
  })
})
