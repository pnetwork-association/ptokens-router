const {
  getRandomAddress,
  deploySafeVaultContract,
  deployErc20TokenContract,
} = require('./test-utils')
const assert = require('assert')

describe('Safe Vault Tests', () => {
  const TOKEN_AMOUNT = 1337
  const TOKEN_SYMBOL = 'SYM'
  const USER_DATA = 0xc0ffee
  const CHAIN_ID = 0xffffffff
  const TOKEN_NAME = 'TokenName'
  const DESTINATION_ADDRESS = getRandomAddress(ethers)

  let OWNER, NON_OWNER, SAFE_VAULT_CONTRACT, TOKEN_CONTRACT

  beforeEach(async () => {
    const signers = await ethers.getSigners()
    OWNER = signers[0]
    NON_OWNER = signers[1]

    SAFE_VAULT_CONTRACT = await deploySafeVaultContract()
    TOKEN_CONTRACT = await deployErc20TokenContract(TOKEN_NAME, TOKEN_SYMBOL)
  })

  it('Safe vault peg in should move tokens to the safe vault', async () => {
    await TOKEN_CONTRACT.approve(SAFE_VAULT_CONTRACT.address, TOKEN_AMOUNT)
    const tokenHolderBalanceBefore = await TOKEN_CONTRACT.balanceOf(OWNER.address)
    const safeVaultBalanceBefore = await TOKEN_CONTRACT.balanceOf(SAFE_VAULT_CONTRACT.address)
    assert(safeVaultBalanceBefore.eq(0))
    await SAFE_VAULT_CONTRACT.pegIn(
      TOKEN_AMOUNT,
      TOKEN_CONTRACT.address,
      DESTINATION_ADDRESS,
      USER_DATA,
      CHAIN_ID,
    )
    const tokenHolderBalanceAfter = await TOKEN_CONTRACT.balanceOf(OWNER.address)
    assert(tokenHolderBalanceBefore.eq(tokenHolderBalanceAfter.add(TOKEN_AMOUNT)))
    const safeVaultBalanceAfter = await TOKEN_CONTRACT.balanceOf(SAFE_VAULT_CONTRACT.address)
    assert(safeVaultBalanceAfter.eq(TOKEN_AMOUNT))
  })

  it('Only owner can transfer tokens from the safe vault', async () => {
    await TOKEN_CONTRACT.approve(SAFE_VAULT_CONTRACT.address, TOKEN_AMOUNT)
    await SAFE_VAULT_CONTRACT.pegIn(
      TOKEN_AMOUNT,
      TOKEN_CONTRACT.address,
      DESTINATION_ADDRESS,
      USER_DATA,
      CHAIN_ID,
    )
    const safeVaultBalanceBefore = await TOKEN_CONTRACT.balanceOf(SAFE_VAULT_CONTRACT.address)
    assert(safeVaultBalanceBefore.eq(TOKEN_AMOUNT))
    const destinationAddressBalanceBefore = await TOKEN_CONTRACT.balanceOf(DESTINATION_ADDRESS)
    assert(destinationAddressBalanceBefore.eq(0))
    await SAFE_VAULT_CONTRACT.transfer(TOKEN_CONTRACT.address, DESTINATION_ADDRESS, TOKEN_AMOUNT)
    const safeVaultBalanceAfter = await TOKEN_CONTRACT.balanceOf(SAFE_VAULT_CONTRACT.address)
    assert(safeVaultBalanceAfter.eq(0))
    const destinationAddressBalanceAfter = await TOKEN_CONTRACT.balanceOf(DESTINATION_ADDRESS)
    assert(destinationAddressBalanceAfter.eq(TOKEN_AMOUNT))
  })

  it('Non owner cannot transfer tokens from the safe vault', async () => {
    await TOKEN_CONTRACT.approve(SAFE_VAULT_CONTRACT.address, TOKEN_AMOUNT)
    await SAFE_VAULT_CONTRACT.pegIn(
      TOKEN_AMOUNT,
      TOKEN_CONTRACT.address,
      DESTINATION_ADDRESS,
      USER_DATA,
      CHAIN_ID,
    )
    const safeVaultBalanceBefore = await TOKEN_CONTRACT.balanceOf(SAFE_VAULT_CONTRACT.address)
    assert(safeVaultBalanceBefore.eq(TOKEN_AMOUNT))
    try {
      await SAFE_VAULT_CONTRACT
        .connect(NON_OWNER)
        .transfer(TOKEN_CONTRACT.address, DESTINATION_ADDRESS, TOKEN_AMOUNT)
      assert.fail('Should not have succeeded!')
    } catch (_err) {
      const expectedErr = 'Ownable: caller is not the owner'
      assert(_err.message.includes(expectedErr))
    }
  })
})
