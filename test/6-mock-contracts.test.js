const {
  deployRouterContract,
  SAMPLE_SAFE_VAULT_ADDRESS,
  deployNonUpgradeableContract,
} = require('./test-utils')
const assert = require('assert')

describe('Mock Contacts', () => {
  let ROUTER_CONTRACT

  beforeEach(async () => {
    ROUTER_CONTRACT = await deployRouterContract([ SAMPLE_SAFE_VAULT_ADDRESS ])
  })

  const getMockErc777Contract = _ =>
    deployNonUpgradeableContract('contracts/test-contracts/MockInterimPToken.sol:MockInterimPToken')

  const getMockVaultContract = _ =>
    deployNonUpgradeableContract('contracts/test-contracts/MockInterimVault.sol:MockInterimVault')

  it('Mock vault origin chain ID should match router origin chain id', async () => {
    const vaultContract = await getMockVaultContract()
    const result = await vaultContract.ORIGIN_CHAIN_ID()
    const expectedResult = await ROUTER_CONTRACT.ORIGIN_CHAIN_ID()
    assert.strictEqual(result, expectedResult)
  })

  it('Mock ERC777 origin chain ID should not match router origin chain id', async () => {
    const erc777Contract = await getMockErc777Contract()
    const routerOriginChainId = await ROUTER_CONTRACT.ORIGIN_CHAIN_ID()
    const result = await erc777Contract.ORIGIN_CHAIN_ID()
    assert.notStrictEqual(result, routerOriginChainId)
  })
})
