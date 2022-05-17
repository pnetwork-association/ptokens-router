const {
  getMockVaultContract,
  getMockErc777Contract,
  SAMPLE_METADATA_CHAIN_ID_1,
} = require('./test-utils')
const assert = require('assert')

describe('Mock Contacts', () => {
  describe('Mock Interim Vault Tests', () => {
    it('Mock vault origin chain ID should match router origin chain id', async () => {
      const vaultContract = await getMockVaultContract(SAMPLE_METADATA_CHAIN_ID_1)
      const result = await vaultContract.ORIGIN_CHAIN_ID()
      assert.strictEqual(result, SAMPLE_METADATA_CHAIN_ID_1)
    })
  })

  describe('Mock ERC777 Tests', () => {
    it('Mock ERC777 origin chain ID should be set on contract creation', async () => {
      const erc777Contract = await getMockErc777Contract(SAMPLE_METADATA_CHAIN_ID_1)
      const result = await erc777Contract.ORIGIN_CHAIN_ID()
      assert.strictEqual(result, SAMPLE_METADATA_CHAIN_ID_1)
    })
  })
})
