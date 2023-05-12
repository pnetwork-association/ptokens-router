const {
  EMPTY_DATA,
  NON_ADMIN_ERROR,
  keccakHashString,
  INTERIM_CHAIN_ID,
  getRandomAddress,
  METADATA_VERSIONS,
  deployFeesContract,
  SAMPLE_ETH_ADDRESS_1,
  SAMPLE_ETH_ADDRESS_2,
  getMockVaultContract,
  deployRouterContract,
  getMockErc777Contract,
  SAMPLE_SAFE_VAULT_ADDRESS,
  SAMPLE_METADATA_CHAIN_ID_1,
  SAMPLE_METADATA_CHAIN_ID_2,
} = require('./test-utils')
const assert = require('assert')
const { curry } = require('ramda')
const { BigNumber } = require('ethers')
const { encodeCoreMetadata } = require('../lib/metadata-encoder')

describe('pTokens Router Contract', () => {
  let ROUTER_CONTRACT, NON_ADMIN, NON_ADMIN_ROUTER_CONTRACT, OWNER

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
    const ADMIN_ROLE = keccakHashString('ADMIN_ROLE')

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
      const safeAddress = await ROUTER_CONTRACT.SAFE_VAULT_ADDRESS()
      await ROUTER_CONTRACT.addVaultAddress(SAMPLE_METADATA_CHAIN_ID_1, SAMPLE_ETH_ADDRESS_1)
      assert.strictEqual(
        await ROUTER_CONTRACT.interimVaultAddresses(SAMPLE_METADATA_CHAIN_ID_1),
        SAMPLE_ETH_ADDRESS_1
      )
      const result = await ROUTER_CONTRACT.safelyGetVaultAddress(SAMPLE_METADATA_CHAIN_ID_1)
      assert.strictEqual(result, SAMPLE_ETH_ADDRESS_1)
      assert.notStrictEqual(result, safeAddress)
    })

    it('Should return safe address if no vault address set for a given chain ID', async () => {
      const safeAddress = await ROUTER_CONTRACT.SAFE_VAULT_ADDRESS()
      assert.strictEqual(await ROUTER_CONTRACT.interimVaultAddresses(SAMPLE_METADATA_CHAIN_ID_1), ZERO_ADDRESS)
      const result = await ROUTER_CONTRACT.safelyGetVaultAddress(SAMPLE_METADATA_CHAIN_ID_1)
      assert.strictEqual(result, safeAddress)
    })
  })

  describe('Miscellaneous Contract Tests', () => {
    it('Should get origin chain ID from another contract', async () => {
      const chainId = '0xdeadbeef'
      const contractWithOriginChainId = await getMockErc777Contract(chainId)
      const result = await ROUTER_CONTRACT.callStatic.getOriginChainIdFromContract(
        contractWithOriginChainId.address
      )
      assert.strictEqual(result, chainId)
    })
  })

  METADATA_VERSIONS.map(_metadataVersion =>
    describe(`Metadata Version ${_metadataVersion} Routing Tests`, () => {
      const PEG_IN_BASIS_POINTS = 10
      const PEG_OUT_BASIS_POINTS = 25
      const NODE_OPERATORS_FEE_SINK_ADDRESS = getRandomAddress(ethers)

      const decodePegInCalledEvent = _event =>
        new Promise((resolve, reject) => {
          const codec = new ethers.utils.AbiCoder()
          try {
            const [ amount, tokenAddress, destinationAddress, userData, destinationChainId ] = codec.decode(
              [ 'uint256', 'address', 'string', 'bytes', 'bytes4' ],
              _event.data
            )
            return resolve({ amount, tokenAddress, destinationAddress, userData, destinationChainId })
          } catch (_err) {
            return reject(_err)
          }
        })

      const decodePegOutCalledEvent = _event =>
        new Promise((resolve, reject) => {
          const codec = new ethers.utils.AbiCoder()
          try {
            const [ amount, userData, destinationAddress, destinationChainId ] = codec.decode(
              [ 'uint256', 'bytes', 'string', 'bytes4' ],
              _event.data
            )
            return resolve({ amount, userData, destinationAddress, destinationChainId })
          } catch (_err) {
            return reject(_err)
          }
        })

      const getEventFromReceipt = curry((_eventSignature, _receipt) =>
        new Promise((resolve, reject) => {
          const eventTopic = keccakHashString(_eventSignature)
          const event = _receipt.events.find(_event => _event.topics[0] === eventTopic)
          return event === undefined
            ? reject(new Error(`Could not find event signature '${_eventSignature}' in receipt!`))
            : resolve(event)
        })
      )

      const getRedeemCalledEventFromReceipt = getEventFromReceipt('RedeemCalled(uint256,bytes,string,bytes4)')
      const getPegInCalledEventFromReceipt = getEventFromReceipt('PegInCalled(uint256,address,string,bytes,bytes4)')

      describe('Peg In Route Tests', () => {
        it('Should peg in successfully', async () => {
          const chainId = '0xdeadbeef'
          assert.notStrictEqual(chainId, INTERIM_CHAIN_ID)
          const pTokenContract = await getMockErc777Contract(chainId)
          const vaultContract = await getMockVaultContract(INTERIM_CHAIN_ID)
          const userData = '0xc0ffee'
          const originChainId = SAMPLE_METADATA_CHAIN_ID_1
          const originAddress = SAMPLE_ETH_ADDRESS_1
          const destinationChainId = SAMPLE_METADATA_CHAIN_ID_2
          const destinationAddress = SAMPLE_ETH_ADDRESS_2
          const metadata = await encodeCoreMetadata(
            userData,
            originChainId,
            originAddress,
            destinationChainId,
            destinationAddress,
            _metadataVersion,
          )
          const amount = 1337
          await ROUTER_CONTRACT.addVaultAddress(SAMPLE_METADATA_CHAIN_ID_2, vaultContract.address)
          const tx = await pTokenContract.send(ROUTER_CONTRACT.address, amount, metadata)
          const receipt = await tx.wait()
          const event = await getPegInCalledEventFromReceipt(receipt)
          const result = await decodePegInCalledEvent(event)
          assert(BigNumber.from(amount).eq(result.amount))
          assert.strictEqual(result.tokenAddress.toLowerCase(), pTokenContract.address.toLowerCase())
          assert.strictEqual(result.destinationAddress.toLowerCase(), SAMPLE_ETH_ADDRESS_2.toLowerCase())
          assert.strictEqual(result.userData, userData)
          assert.strictEqual(result.destinationChainId, SAMPLE_METADATA_CHAIN_ID_2)
          const routerContractBalance = await pTokenContract.balanceOf(ROUTER_CONTRACT.address)
          const vaultContractBalance = await pTokenContract.balanceOf(vaultContract.address)
          assert(routerContractBalance.eq(0))
          assert(vaultContractBalance.eq(amount))
        })

        it('Should take correct peg in fees', async () => {
          // Deploy a fee contract...
          const feeContract = await deployFeesContract(NODE_OPERATORS_FEE_SINK_ADDRESS, PEG_IN_BASIS_POINTS, PEG_OUT_BASIS_POINTS)

          // Set the chain ID in the ptoken contract...
          const chainId = '0xdeadbeef'
          assert.notStrictEqual(chainId, INTERIM_CHAIN_ID)
          const pTokenContract = await getMockErc777Contract(chainId)

          // Add the fee contract to the mapping in the router...
          ROUTER_CONTRACT.setFeeContractAddress(feeContract.address)

          // Set up the vault contract...
          const vaultContract = await getMockVaultContract(INTERIM_CHAIN_ID)
          await ROUTER_CONTRACT.addVaultAddress(SAMPLE_METADATA_CHAIN_ID_2, vaultContract.address)

          // Assert the various contracts' token balances before the peg in...
          let feeSinkBalance = await pTokenContract.balanceOf(NODE_OPERATORS_FEE_SINK_ADDRESS)
          let vaultContractBalance = await pTokenContract.balanceOf(vaultContract.address)
          let routerContractBalance = await pTokenContract.balanceOf(ROUTER_CONTRACT.address)
          assert(feeSinkBalance.eq(0))
          assert(vaultContractBalance.eq(0))
          assert(routerContractBalance.eq(0))

          // Create and make the transaction...
          const amount = 1337
          const userData = '0xc0ffee'
          const originChainId = SAMPLE_METADATA_CHAIN_ID_1
          const originAddress = SAMPLE_ETH_ADDRESS_1
          const destinationChainId = SAMPLE_METADATA_CHAIN_ID_2
          const destinationAddress = SAMPLE_ETH_ADDRESS_2
          const metadata = await encodeCoreMetadata(
            userData,
            originChainId,
            originAddress,
            destinationChainId,
            destinationAddress,
            _metadataVersion,
          )
          const tx = await pTokenContract.send(ROUTER_CONTRACT.address, amount, metadata)
          const receipt = await tx.wait()
          const event = await getPegInCalledEventFromReceipt(receipt)
          const result = await decodePegInCalledEvent(event)

          // Calculate the expected fee and expected final amount
          const basisPointsDivisor = await feeContract.FEE_BASIS_POINTS_DIVISOR()
          const pegInBasisPoints = await feeContract.PEG_IN_BASIS_POINTS()
          const expectedFee = Math.floor(amount * pegInBasisPoints / basisPointsDivisor)
          const expectedAmountMinusFee = BigNumber.from(amount - expectedFee)
          assert(result.amount.eq(expectedAmountMinusFee))

          // Assert the remaining tx return values...
          assert.strictEqual(result.tokenAddress.toLowerCase(), pTokenContract.address.toLowerCase())
          assert.strictEqual(result.destinationAddress.toLowerCase(), SAMPLE_ETH_ADDRESS_2.toLowerCase())
          assert.strictEqual(result.userData, userData)
          assert.strictEqual(result.destinationChainId, SAMPLE_METADATA_CHAIN_ID_2)

          // And finally assert the token balances of the various accounts involved.
          feeSinkBalance = await pTokenContract.balanceOf(NODE_OPERATORS_FEE_SINK_ADDRESS)
          vaultContractBalance = await pTokenContract.balanceOf(vaultContract.address)
          routerContractBalance = await pTokenContract.balanceOf(ROUTER_CONTRACT.address)
          assert(routerContractBalance.eq(0))
          assert(feeSinkBalance.eq(BigNumber.from(expectedFee)))
          assert(vaultContractBalance.eq(expectedAmountMinusFee))
        })
      })

      describe('Peg Out Route Tests', () => {
        it('Should peg out successfully', async () => {
          const chainId = '0xdeadbeef'
          assert.notStrictEqual(chainId, INTERIM_CHAIN_ID)
          const pTokenContract = await getMockErc777Contract(chainId)
          const vaultContract = await getMockVaultContract(INTERIM_CHAIN_ID)
          const amount = 1337
          const userData = '0xc0ffee'
          const originChainId = SAMPLE_METADATA_CHAIN_ID_1
          const originAddress = SAMPLE_ETH_ADDRESS_1
          const destinationChainId = chainId
          const destinationAddress = SAMPLE_ETH_ADDRESS_2
          const metadata = await encodeCoreMetadata(
            userData,
            originChainId,
            originAddress,
            destinationChainId,
            destinationAddress,
            _metadataVersion,
          )
          await pTokenContract.send(vaultContract.address, amount, EMPTY_DATA)
          let vaultContractBalance = await pTokenContract.balanceOf(vaultContract.address)
          let routerContractBalance = await pTokenContract.balanceOf(ROUTER_CONTRACT.address)
          let pTokenContractBalance = await pTokenContract.balanceOf(pTokenContract.address)
          assert(vaultContractBalance.eq(amount))
          assert(routerContractBalance.eq(0))
          assert(pTokenContractBalance.eq(0))
          const tx = await vaultContract.pegOut(ROUTER_CONTRACT.address, pTokenContract.address, amount, metadata)
          const receipt = await tx.wait()
          const redeemEvent = await getRedeemCalledEventFromReceipt(receipt)
          const result = await decodePegOutCalledEvent(redeemEvent)
          assert(result.amount.eq(amount))
          assert.strictEqual(result.userData, userData)
          assert.strictEqual(result.destinationAddress.toLowerCase(), destinationAddress.toLowerCase())
          assert.strictEqual(result.destinationChainId, destinationChainId)
          vaultContractBalance = await pTokenContract.balanceOf(vaultContract.address)
          routerContractBalance = await pTokenContract.balanceOf(ROUTER_CONTRACT.address)
          pTokenContractBalance = await pTokenContract.balanceOf(pTokenContract.address)
          assert(vaultContractBalance.eq(0))
          assert(routerContractBalance.eq(0))
          assert(pTokenContractBalance.eq(0))
        })

        it('Should take correct peg out fees', async () => {
          // Deploy a fee contract...
          const feeContract = await deployFeesContract(NODE_OPERATORS_FEE_SINK_ADDRESS, PEG_IN_BASIS_POINTS, PEG_OUT_BASIS_POINTS)

          // Deploy the ptoken & vault contracts...
          const chainId = '0xdeadbeef'
          assert.notStrictEqual(chainId, INTERIM_CHAIN_ID)
          const pTokenContract = await getMockErc777Contract(chainId)
          const vaultContract = await getMockVaultContract(INTERIM_CHAIN_ID)

          // Add the fee contract to the mapping in the router...
          ROUTER_CONTRACT.setFeeContractAddress(feeContract.address)

          // Create the tx params...
          const amount = 1337
          const userData = '0xc0ffee'
          const originChainId = SAMPLE_METADATA_CHAIN_ID_1
          const originAddress = SAMPLE_ETH_ADDRESS_1
          const destinationChainId = chainId
          const destinationAddress = SAMPLE_ETH_ADDRESS_2
          const metadata = await encodeCoreMetadata(
            userData,
            originChainId,
            originAddress,
            destinationChainId,
            destinationAddress,
            _metadataVersion,
          )

          // Send some tokens to the vault so there's a balance to be pegged out...
          await pTokenContract.send(vaultContract.address, amount, EMPTY_DATA)

          // Get & assert the various token balances before the peg out...
          let feeSinkBalance = await pTokenContract.balanceOf(NODE_OPERATORS_FEE_SINK_ADDRESS)
          let vaultContractBalance = await pTokenContract.balanceOf(vaultContract.address)
          let routerContractBalance = await pTokenContract.balanceOf(ROUTER_CONTRACT.address)
          let pTokenContractBalance = await pTokenContract.balanceOf(pTokenContract.address)
          assert(feeSinkBalance.eq(0))
          assert(routerContractBalance.eq(0))
          assert(pTokenContractBalance.eq(0))
          assert(vaultContractBalance.eq(amount))

          // Make the peg out tx...
          const tx = await vaultContract.pegOut(ROUTER_CONTRACT.address, pTokenContract.address, amount, metadata)
          const receipt = await tx.wait()
          const redeemEvent = await getRedeemCalledEventFromReceipt(receipt)
          const result = await decodePegOutCalledEvent(redeemEvent)

          // Calculate the expected fee and expected final amount
          const basisPointsDivisor = await feeContract.FEE_BASIS_POINTS_DIVISOR()
          const pegOutBasisPoints = await feeContract.PEG_OUT_BASIS_POINTS()
          const expectedFee = Math.floor(amount * pegOutBasisPoints / basisPointsDivisor)
          const expectedAmountMinusFee = BigNumber.from(amount - expectedFee)
          assert(result.amount.eq(expectedAmountMinusFee))

          // Assert the remaining return values...
          assert.strictEqual(result.userData, userData)
          assert.strictEqual(result.destinationAddress.toLowerCase(), destinationAddress.toLowerCase())
          assert.strictEqual(result.destinationChainId, destinationChainId)

          // Get & assert the final contract values...
          feeSinkBalance = await pTokenContract.balanceOf(NODE_OPERATORS_FEE_SINK_ADDRESS)
          vaultContractBalance = await pTokenContract.balanceOf(vaultContract.address)
          routerContractBalance = await pTokenContract.balanceOf(ROUTER_CONTRACT.address)
          pTokenContractBalance = await pTokenContract.balanceOf(pTokenContract.address)
          assert(vaultContractBalance.eq(0))
          assert(routerContractBalance.eq(0))
          assert(pTokenContractBalance.eq(0))
          assert(feeSinkBalance.eq(expectedFee))
        })

        it('Should peg out from one vault to another successfully', async () => {
          const chainId1 = '0xdeadbeef'
          const chainId2 = '0xdecaffff'
          assert.notStrictEqual(chainId1, chainId2)
          assert.notStrictEqual(chainId1, INTERIM_CHAIN_ID)
          assert.notStrictEqual(chainId2, INTERIM_CHAIN_ID)
          const pTokenContract = await getMockErc777Contract(chainId1)
          const mockVaultContract1 = await getMockVaultContract(INTERIM_CHAIN_ID)
          const mockVaultContract2 = await getMockVaultContract(INTERIM_CHAIN_ID)
          let mockVaultContract1Balance = await pTokenContract.balanceOf(mockVaultContract1.address)
          let mockVaultContract2Balance = await pTokenContract.balanceOf(mockVaultContract2.address)
          let routerContractBalance = await pTokenContract.balanceOf(ROUTER_CONTRACT.address)
          assert(routerContractBalance.eq(0))
          assert(mockVaultContract1Balance.eq(0))
          assert(mockVaultContract1Balance.eq(0))
          await ROUTER_CONTRACT.addVaultAddress(chainId2, mockVaultContract2.address)
          const amount = 1337
          const userData = '0xc0ffee'
          const originChainId = SAMPLE_METADATA_CHAIN_ID_1
          const originAddress = SAMPLE_ETH_ADDRESS_1
          const destinationChainId = chainId2
          const destinationAddress = SAMPLE_ETH_ADDRESS_2
          const metadata = await encodeCoreMetadata(
            userData,
            originChainId,
            originAddress,
            destinationChainId,
            destinationAddress,
            _metadataVersion,
          )
          await pTokenContract.send(mockVaultContract1.address, amount, EMPTY_DATA)
          routerContractBalance = await pTokenContract.balanceOf(ROUTER_CONTRACT.address)
          mockVaultContract1Balance = await pTokenContract.balanceOf(mockVaultContract1.address)
          mockVaultContract2Balance = await pTokenContract.balanceOf(mockVaultContract2.address)
          assert(routerContractBalance.eq(0))
          assert(mockVaultContract1Balance.eq(amount))
          assert(mockVaultContract2Balance.eq(0))
          const tx = await mockVaultContract1.pegOut(
            ROUTER_CONTRACT.address,
            pTokenContract.address,
            amount,
            metadata
          )
          const receipt = await tx.wait()
          const pegInCalledEvent = await getPegInCalledEventFromReceipt(receipt)
          const result = await decodePegInCalledEvent(pegInCalledEvent)
          assert(BigNumber.from(amount).eq(result.amount))
          assert.strictEqual(result.tokenAddress.toLowerCase(), pTokenContract.address.toLowerCase())
          assert.strictEqual(result.destinationAddress.toLowerCase(), SAMPLE_ETH_ADDRESS_2.toLowerCase())
          assert.strictEqual(result.userData, userData)
          assert.strictEqual(result.destinationChainId, destinationChainId)
          routerContractBalance = await pTokenContract.balanceOf(ROUTER_CONTRACT.address)
          mockVaultContract1Balance = await pTokenContract.balanceOf(mockVaultContract1.address)
          mockVaultContract2Balance = await pTokenContract.balanceOf(mockVaultContract2.address)
          assert(routerContractBalance.eq(0))
          assert(mockVaultContract1Balance.eq(0))
          assert(mockVaultContract2Balance.eq(amount))
        })
      })
    })
  )
})
