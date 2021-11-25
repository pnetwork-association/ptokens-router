const {
  SAMPLE_ETH_ADDRESS_1,
  SAMPLE_METADATA_CHAIN_ID_1,
} = require('./test-utils')
const assert = require('assert')

describe('pTokens Router Contract', () => {
  const getRoleHash = _roleStr =>
    ethers.utils.keccak256(ethers.utils.toUtf8Bytes(_roleStr))

  let ROUTER_CONTRACT, CONTRACT_FACTORY, NON_ADMIN, NON_ADMIN_ROUTER_CONTRACT, OWNER
  const ADMIN_ROLE = getRoleHash('ADMIN_ROLE')
  const MINTER_ROLE = getRoleHash('MINTER_ROLE')
  const NON_ADMIN_ERROR = 'Caller is not an admin'
  const REDEEMER_ROLE = getRoleHash('REDEEMER_ROLE')
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
  const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000'

  beforeEach(async () => {
    const ROUTER_CONTRACT_PATH = 'contracts/PTokensRouter.sol:PTokensRouter'
    const signers = await ethers.getSigners()
    OWNER = signers[0]
    NON_ADMIN = signers[1]
    CONTRACT_FACTORY = await ethers.getContractFactory(ROUTER_CONTRACT_PATH)
    ROUTER_CONTRACT = await upgrades.deployProxy(CONTRACT_FACTORY, [])
    NON_ADMIN_ROUTER_CONTRACT = ROUTER_CONTRACT.connect(NON_ADMIN)
  })

  describe('Initialization Tests', () => {
    it('Deploying account should have admin role', async () => {
      assert(await ROUTER_CONTRACT.hasRole(DEFAULT_ADMIN_ROLE, OWNER.address))
    })
  })

  describe('Admin Tests', () => {
    it('Admin can add vault addresses', async () => {
      const vaultAddressBefore = await ROUTER_CONTRACT.vaultAddresses(SAMPLE_METADATA_CHAIN_ID_1)
      assert.strictEqual(vaultAddressBefore, ZERO_ADDRESS)
      await ROUTER_CONTRACT.addVaultAddress(SAMPLE_METADATA_CHAIN_ID_1, SAMPLE_ETH_ADDRESS_1)
      const vaultAddressAfter = await ROUTER_CONTRACT.vaultAddresses(SAMPLE_METADATA_CHAIN_ID_1)
      assert.strictEqual(vaultAddressAfter, SAMPLE_ETH_ADDRESS_1)
    })

    it('Admin can remove vault addresses', async () => {
      await ROUTER_CONTRACT.addVaultAddress(SAMPLE_METADATA_CHAIN_ID_1, SAMPLE_ETH_ADDRESS_1)
      const vaultAddressBefore = await ROUTER_CONTRACT.vaultAddresses(SAMPLE_METADATA_CHAIN_ID_1)
      assert.strictEqual(vaultAddressBefore, SAMPLE_ETH_ADDRESS_1)
      await ROUTER_CONTRACT.removeVaultAddress(SAMPLE_METADATA_CHAIN_ID_1)
      const vaultAddressAfter = await ROUTER_CONTRACT.vaultAddresses(SAMPLE_METADATA_CHAIN_ID_1)
      assert.strictEqual(vaultAddressAfter, ZERO_ADDRESS)
    })

    it('Non owner cannot add vault addresses', async () => {
      try {
        await NON_ADMIN_ROUTER_CONTRACT.addVaultAddress(SAMPLE_METADATA_CHAIN_ID_1, SAMPLE_ETH_ADDRESS_1)
        assert.fail('Should not have succeeded!')
      } catch (_err) {
        assert(_err.message.includes(NON_ADMIN_ERROR))
      }
    })

    it('Non owner cannot add vault addresses', async () => {
      ROUTER_CONTRACT.addVaultAddress(SAMPLE_METADATA_CHAIN_ID_1, SAMPLE_ETH_ADDRESS_1)
      assert.strictEqual(await ROUTER_CONTRACT.vaultAddresses(SAMPLE_METADATA_CHAIN_ID_1), SAMPLE_ETH_ADDRESS_1)
      try {
        await NON_ADMIN_ROUTER_CONTRACT.removeVaultAddress(SAMPLE_METADATA_CHAIN_ID_1)
        assert.fail('Should not have succeeded!')
      } catch (_err) {
        assert(_err.message.includes(NON_ADMIN_ERROR))
      }
      assert.strictEqual(await ROUTER_CONTRACT.vaultAddresses(SAMPLE_METADATA_CHAIN_ID_1), SAMPLE_ETH_ADDRESS_1)
    })
  })

  describe('Adding & Removing Vault Addresses', () => {
    it('Admin can add vault address', async () => {
      assert.strictEqual(await ROUTER_CONTRACT.vaultAddresses(SAMPLE_METADATA_CHAIN_ID_1), ZERO_ADDRESS)
      await ROUTER_CONTRACT.addVaultAddress(SAMPLE_METADATA_CHAIN_ID_1, SAMPLE_ETH_ADDRESS_1)
      assert.strictEqual(await ROUTER_CONTRACT.vaultAddresses(SAMPLE_METADATA_CHAIN_ID_1), SAMPLE_ETH_ADDRESS_1)
    })

    it('Non admin cannot add vault address', async () => {
      assert.strictEqual(await ROUTER_CONTRACT.vaultAddresses(SAMPLE_METADATA_CHAIN_ID_1), ZERO_ADDRESS)
      try {
        await NON_ADMIN_ROUTER_CONTRACT.addVaultAddress(SAMPLE_METADATA_CHAIN_ID_1, SAMPLE_ETH_ADDRESS_1)
        assert.fail('Should not have succeeded!')
      } catch (_err) {
        assert(_err.message.includes(NON_ADMIN_ERROR))
      }
    })

    it('Admin can remove vault address', async () => {
      await ROUTER_CONTRACT.addVaultAddress(SAMPLE_METADATA_CHAIN_ID_1, SAMPLE_ETH_ADDRESS_1)
      assert.strictEqual(await ROUTER_CONTRACT.vaultAddresses(SAMPLE_METADATA_CHAIN_ID_1), SAMPLE_ETH_ADDRESS_1)
      await ROUTER_CONTRACT.removeVaultAddress(SAMPLE_METADATA_CHAIN_ID_1)
      assert.strictEqual(await ROUTER_CONTRACT.vaultAddresses(SAMPLE_METADATA_CHAIN_ID_1), ZERO_ADDRESS)
    })

    it('Non admin cannot remove vault address', async () => {
      await ROUTER_CONTRACT.addVaultAddress(SAMPLE_METADATA_CHAIN_ID_1, SAMPLE_ETH_ADDRESS_1)
      assert.strictEqual(await ROUTER_CONTRACT.vaultAddresses(SAMPLE_METADATA_CHAIN_ID_1), SAMPLE_ETH_ADDRESS_1)
      try {
        await NON_ADMIN_ROUTER_CONTRACT.removeVaultAddress(SAMPLE_METADATA_CHAIN_ID_1)
        assert.fail('Should not have succeeded!')
      } catch (_err) {
        assert(_err.message.includes(NON_ADMIN_ERROR))
      }
    })
  })

  describe('Minter Role Tests', () => {
    it('Admin can grant minter role', async () => {
      assert(!await ROUTER_CONTRACT.hasMinterRole(SAMPLE_ETH_ADDRESS_1))
      ROUTER_CONTRACT.grantMinterRole(SAMPLE_ETH_ADDRESS_1)
      assert(await ROUTER_CONTRACT.hasMinterRole(SAMPLE_ETH_ADDRESS_1))
    })

    it('Non admin cannot grant minter role', async () => {
      try {
        await NON_ADMIN_ROUTER_CONTRACT.grantMinterRole(SAMPLE_ETH_ADDRESS_1)
        assert.fail('Should not have succeeded!')
      } catch (_err) {
        assert(_err.message.includes('missing role'))
        assert(!await ROUTER_CONTRACT.hasMinterRole(SAMPLE_ETH_ADDRESS_1))
      }
    })

    it('Admin can revoke minter role', async () => {
      ROUTER_CONTRACT.grantMinterRole(SAMPLE_ETH_ADDRESS_1)
      assert(await ROUTER_CONTRACT.hasMinterRole(SAMPLE_ETH_ADDRESS_1))
      ROUTER_CONTRACT.revokeMinterRole(SAMPLE_ETH_ADDRESS_1)
      assert(!await ROUTER_CONTRACT.hasMinterRole(SAMPLE_ETH_ADDRESS_1))
    })

    it('Non admin cannot revoke minter role', async () => {
      ROUTER_CONTRACT.grantMinterRole(SAMPLE_ETH_ADDRESS_1)
      assert(await ROUTER_CONTRACT.hasMinterRole(SAMPLE_ETH_ADDRESS_1))
      try {
        await NON_ADMIN_ROUTER_CONTRACT.grantMinterRole(SAMPLE_ETH_ADDRESS_1)
        assert.fail('Should not have succeeded!')
      } catch (_err) {
        assert(_err.message.includes('missing role'))
        assert(await ROUTER_CONTRACT.hasMinterRole(SAMPLE_ETH_ADDRESS_1))
      }
    })
  })

  describe('Redeemer Role Tests', () => {
    it('Admin can grant redeemer role', async () => {
      assert(!await ROUTER_CONTRACT.hasRedeemerRole(SAMPLE_ETH_ADDRESS_1))
      ROUTER_CONTRACT.grantRedeemerRole(SAMPLE_ETH_ADDRESS_1)
      assert(await ROUTER_CONTRACT.hasRedeemerRole(SAMPLE_ETH_ADDRESS_1))
    })

    it('Non admin cannot grant redeemer role', async () => {
      try {
        await NON_ADMIN_ROUTER_CONTRACT.grantRedeemerRole(SAMPLE_ETH_ADDRESS_1)
        assert.fail('Should not have succeeded!')
      } catch (_err) {
        assert(_err.message.includes('missing role'))
        assert(!await ROUTER_CONTRACT.hasRedeemerRole(SAMPLE_ETH_ADDRESS_1))
      }
    })

    it('Admin can revoke redeemer role', async () => {
      ROUTER_CONTRACT.grantRedeemerRole(SAMPLE_ETH_ADDRESS_1)
      assert(await ROUTER_CONTRACT.hasRedeemerRole(SAMPLE_ETH_ADDRESS_1))
      ROUTER_CONTRACT.revokeRedeemerRole(SAMPLE_ETH_ADDRESS_1)
      assert(!await ROUTER_CONTRACT.hasRedeemerRole(SAMPLE_ETH_ADDRESS_1))
    })

    it('Non admin cannot revoke redeemer role', async () => {
      ROUTER_CONTRACT.grantRedeemerRole(SAMPLE_ETH_ADDRESS_1)
      assert(await ROUTER_CONTRACT.hasRedeemerRole(SAMPLE_ETH_ADDRESS_1))
      try {
        await NON_ADMIN_ROUTER_CONTRACT.grantRedeemerRole(SAMPLE_ETH_ADDRESS_1)
        assert.fail('Should not have succeeded!')
      } catch (_err) {
        assert(_err.message.includes('missing role'))
        assert(await ROUTER_CONTRACT.hasRedeemerRole(SAMPLE_ETH_ADDRESS_1))
      }
    })
  })
})
