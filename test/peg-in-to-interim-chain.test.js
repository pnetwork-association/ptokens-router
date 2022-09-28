const {
  EMPTY_DATA,
  INTERIM_CHAIN_ID,
  METADATA_VERSIONS,
  SAMPLE_ETH_ADDRESS_1,
  SAMPLE_ETH_ADDRESS_2,
  deployRouterContract,
  getMockErc777Contract,
  SAMPLE_SAFE_VAULT_ADDRESS,
  SAMPLE_METADATA_CHAIN_ID_1,
} = require('./test-utils')
const assert = require('assert')
const { encodeCoreMetadata } = require('../lib/metadata-encoder')

describe('Peg In To Interim Chain Tests', () => {
  let ROUTER_CONTRACT, ROUTER_CONTRACT_ADDRESS

  beforeEach(async () => {
    ROUTER_CONTRACT = await deployRouterContract([ SAMPLE_SAFE_VAULT_ADDRESS ])
    ROUTER_CONTRACT_ADDRESS = ROUTER_CONTRACT.address
  })

  METADATA_VERSIONS.map(_metadataVersion =>
    it(`Should peg in to interim chain successfully using metadata version ${_metadataVersion}`, async () => {
      // NOTE: Set up the token contract that we'll use...
      const tokenContractChainId = '0xdeadb33f'
      const ipTokenContract = await getMockErc777Contract(tokenContractChainId)

      // NOTE: Prepare the metadata for the router to decode...
      const originChainId = SAMPLE_METADATA_CHAIN_ID_1
      const originAddress = SAMPLE_ETH_ADDRESS_1
      const destinationAddress = SAMPLE_ETH_ADDRESS_2
      const destinationChainId = INTERIM_CHAIN_ID
      const metadata = await encodeCoreMetadata(
        EMPTY_DATA,
        originChainId,
        originAddress,
        destinationChainId, // NOTE: This is the important bit here.
        destinationAddress,
        _metadataVersion,
      )
      const tokenAmount = 1337

      // NOTE: Assert that the destination address on the interim chain has no tokens yet.
      const destinationTokenBalanceBefore = await ipTokenContract.balanceOf(destinationAddress)
      assert(destinationTokenBalanceBefore.eq(0))

      // NOTE: Assert that the router has no tokens either.
      const routerTokenBalanceBefore = await ipTokenContract.balanceOf(ROUTER_CONTRACT_ADDRESS)
      assert(routerTokenBalanceBefore.eq(0))

      // NOTE: Sending ERC777 tokens to the router calls the `tokensReceived` hook whence routing begins...
      const tx = await ipTokenContract.send(ROUTER_CONTRACT_ADDRESS, tokenAmount, metadata)
      const txReceipt = await tx.wait()
      const eventsEmittedDuringTx = txReceipt.events.map(_event => _event.event)

      // NOTE: Finally, assert that the destination address now has those tokens.
      const destinationTokenBalanceAfter = await ipTokenContract.balanceOf(destinationAddress)
      assert(destinationTokenBalanceAfter.eq(tokenAmount))

      // NOTE: Assert that the tokens didn't get stuck in the router.
      const routerTokenBalanceAfter = await ipTokenContract.balanceOf(ROUTER_CONTRACT_ADDRESS)
      assert(routerTokenBalanceAfter.eq(0))

      // NOTE: Assert that the tx emitted no peg in or redeem events...
      const eventsThatShouldNotHaveBeenEmitted = ['RedeemCalled', 'PegInCalled']
      eventsThatShouldNotHaveBeenEmitted
        .map(_eventThatShouldNotHaveBeenEmitted =>
          eventsEmittedDuringTx
            .map(_eventName =>
              assert.notStrictEqual(
                _eventName,
                _eventThatShouldNotHaveBeenEmitted,
                `${_eventThatShouldNotHaveBeenEmitted} event was emitted!`
              )
            )
        )
    })
  )
})
