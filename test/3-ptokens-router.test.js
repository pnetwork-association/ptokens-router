const {
  SAMPLE_ETH_ADDRESS_1,
  SAMPLE_ETH_ADDRESS_2,
  deployRouterContract,
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
    ROUTER_CONTRACT = await deployRouterContract()
    NON_ADMIN_ROUTER_CONTRACT = ROUTER_CONTRACT.connect(NON_ADMIN)
  })

  describe('Initialization Tests', () => {
    it('Deploying account should have default admin role', async () => {
      assert(await ROUTER_CONTRACT.hasRole(DEFAULT_ADMIN_ROLE, OWNER.address))
    })

    it('Deploying account should have admin role', async () => {
      assert(await ROUTER_CONTRACT.hasRole(ADMIN_ROLE, OWNER.address))
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
})
