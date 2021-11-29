const {
  SAMPLE_ETH_ADDRESS_1,
  deployRouterContract,
  SAMPLE_SAFE_VAULT_ADDRESS,
  SAMPLE_METADATA_CHAIN_ID_1,
} = require('./test-utils')
const assert = require('assert')

describe('pTokens Router Contract', () => {
  const getRoleHash = _roleStr =>
    ethers.utils.keccak256(ethers.utils.toUtf8Bytes(_roleStr))

  let ROUTER_CONTRACT, NON_ADMIN, NON_ADMIN_ROUTER_CONTRACT, OWNER
  const ADMIN_ROLE = getRoleHash('ADMIN_ROLE')
  const NON_ADMIN_ERROR = 'Caller is not an admin'
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
  const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000'

  beforeEach(async () => {
    const signers = await ethers.getSigners()
    OWNER = signers[0]
    NON_ADMIN = signers[1]
    ROUTER_CONTRACT = await deployRouterContract([ SAMPLE_SAFE_VAULT_ADDRESS ])
    NON_ADMIN_ROUTER_CONTRACT = ROUTER_CONTRACT.connect(NON_ADMIN)
  })

  describe('Initialization Tests', () => {
    it('Deploying account should have default admin role', async () => {
      assert(await ROUTER_CONTRACT.hasRole(DEFAULT_ADMIN_ROLE, OWNER.address))
    })

    it('Deploying account should have admin role', async () => {
      assert(await ROUTER_CONTRACT.hasRole(ADMIN_ROLE, OWNER.address))
    })

    it('Should set safe vault address', async () => {
      assert(await ROUTER_CONTRACT.SAFE_VAULT_ADDRESS(), SAMPLE_SAFE_VAULT_ADDRESS)
    })
  })

  describe('Admin Tests', () => {
    it('Admin can add vault addresses', async () => {
      const vaultAddressBefore = await ROUTER_CONTRACT.interimVaultAddresses(SAMPLE_METADATA_CHAIN_ID_1)
      assert.strictEqual(vaultAddressBefore, ZERO_ADDRESS)
      await ROUTER_CONTRACT.addVaultAddress(SAMPLE_METADATA_CHAIN_ID_1, SAMPLE_ETH_ADDRESS_1)
      const vaultAddressAfter = await ROUTER_CONTRACT.interimVaultAddresses(SAMPLE_METADATA_CHAIN_ID_1)
      assert.strictEqual(vaultAddressAfter, SAMPLE_ETH_ADDRESS_1)
    })

    it('Admin can remove vault addresses', async () => {
      await ROUTER_CONTRACT.addVaultAddress(SAMPLE_METADATA_CHAIN_ID_1, SAMPLE_ETH_ADDRESS_1)
      const vaultAddressBefore = await ROUTER_CONTRACT.interimVaultAddresses(SAMPLE_METADATA_CHAIN_ID_1)
      assert.strictEqual(vaultAddressBefore, SAMPLE_ETH_ADDRESS_1)
      await ROUTER_CONTRACT.removeVaultAddress(SAMPLE_METADATA_CHAIN_ID_1)
      const vaultAddressAfter = await ROUTER_CONTRACT.interimVaultAddresses(SAMPLE_METADATA_CHAIN_ID_1)
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
      assert.strictEqual(
        await ROUTER_CONTRACT.interimVaultAddresses(SAMPLE_METADATA_CHAIN_ID_1),
        SAMPLE_ETH_ADDRESS_1
      )
      try {
        await NON_ADMIN_ROUTER_CONTRACT.removeVaultAddress(SAMPLE_METADATA_CHAIN_ID_1)
        assert.fail('Should not have succeeded!')
      } catch (_err) {
        assert(_err.message.includes(NON_ADMIN_ERROR))
      }
      assert.strictEqual(
        await ROUTER_CONTRACT.interimVaultAddresses(SAMPLE_METADATA_CHAIN_ID_1),
        SAMPLE_ETH_ADDRESS_1
      )
    })
  })

  describe('Safely Get Vault Address Tests', () => {
    it('Admin can update safe vault address', async () => {
      assert(await ROUTER_CONTRACT.SAFE_VAULT_ADDRESS(), SAMPLE_SAFE_VAULT_ADDRESS)
      await ROUTER_CONTRACT.updateSafeVaultAddress(SAMPLE_ETH_ADDRESS_1)
      assert(await ROUTER_CONTRACT.SAFE_VAULT_ADDRESS(), SAMPLE_ETH_ADDRESS_1)
    })

    it('Non admin cannot update safe vault address', async () => {
      assert(await ROUTER_CONTRACT.SAFE_VAULT_ADDRESS(), SAMPLE_SAFE_VAULT_ADDRESS)
      try {
        await NON_ADMIN_ROUTER_CONTRACT.updateSafeVaultAddress(SAMPLE_ETH_ADDRESS_1)
        assert.fail('Should not have succeeded!')
      } catch (_err) {
        assert(_err.message.includes(NON_ADMIN_ERROR))
        assert(await ROUTER_CONTRACT.SAFE_VAULT_ADDRESS(), SAMPLE_ETH_ADDRESS_1)
      }
    })

    it('Should safely get a vault address', async () => {
      let safeAddress = await ROUTER_CONTRACT.SAFE_VAULT_ADDRESS()
      await ROUTER_CONTRACT.addVaultAddress(SAMPLE_METADATA_CHAIN_ID_1, SAMPLE_ETH_ADDRESS_1)
      assert.strictEqual(
        await ROUTER_CONTRACT.interimVaultAddresses(SAMPLE_METADATA_CHAIN_ID_1),
        SAMPLE_ETH_ADDRESS_1
      )
      let result = await ROUTER_CONTRACT.safelyGetVaultAddress(SAMPLE_METADATA_CHAIN_ID_1)
      assert.strictEqual(result, SAMPLE_ETH_ADDRESS_1)
      assert.notStrictEqual(result, safeAddress)
    })

    it('Should return safe address if no vault address set for a given chain ID', async () => {
      let safeAddress = await ROUTER_CONTRACT.SAFE_VAULT_ADDRESS()
      assert.strictEqual(await ROUTER_CONTRACT.interimVaultAddresses(SAMPLE_METADATA_CHAIN_ID_1), ZERO_ADDRESS)
      let result = await ROUTER_CONTRACT.safelyGetVaultAddress(SAMPLE_METADATA_CHAIN_ID_1)
      assert.strictEqual(result, safeAddress)
    })
  })
})
