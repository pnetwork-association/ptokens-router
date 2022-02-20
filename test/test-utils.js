const EMPTY_DATA = '0x'
const SAMPLE_USER_DATA = '0xd3caff'
const INTERIM_CHAIN_ID = '0xffffffff'
const SAMPLE_METADATA_CHAIN_ID_1 = '0x00f34368' // NOTE: Rinkeby
const SAMPLE_METADATA_CHAIN_ID_2 = '0x0069c322' // NOTE: Ropsten
const SAMPLE_ETH_ADDRESS_1 = '0xfEDFe2616EB3661CB8FEd2782F5F0cC91D59DCaC'
const SAMPLE_ETH_ADDRESS_2 = '0xedB86cd455ef3ca43f0e227e00469C3bDFA40628'
const SAMPLE_SAFE_VAULT_ADDRESS = '0xd757fd54b273BB1234d4d9993f27699d28d0EDD2'

const deployRouterContract = async (_deployArgs = []) =>
  upgrades.deployProxy(
    await ethers.getContractFactory('contracts/PTokensRouter.sol:PTokensRouter'),
    _deployArgs
  )

const deployNonUpgradeableContract = (_contractPath, _deployArgs = []) =>
  ethers
    .getContractFactory(_contractPath)
    .then(_factory => _factory.deploy(..._deployArgs))
    .then(_contract => Promise.all([ _contract, _contract.deployTransaction.wait() ]))
    .then(([ _contract ]) => _contract)

const getMockErc777Contract = _originChainId =>
  deployNonUpgradeableContract(
    'contracts/test-contracts/MockInterimPToken.sol:MockInterimPToken',
    [ _originChainId ],
  )

const getMockVaultContract = _originChainId =>
  deployNonUpgradeableContract(
    'contracts/test-contracts/MockInterimVault.sol:MockInterimVault',
    [ _originChainId ],
  )

const keccakHashString = _s =>
  ethers.utils.keccak256(ethers.utils.toUtf8Bytes(_s))

/* eslint-disable-next-line no-return-assign */
const silenceConsoleOutput = _ =>
  /* eslint-disable-next-line no-empty-function */
  console.info = () => {}

module.exports = {
  deployNonUpgradeableContract,
  SAMPLE_METADATA_CHAIN_ID_1,
  SAMPLE_METADATA_CHAIN_ID_2,
  SAMPLE_SAFE_VAULT_ADDRESS,
  getMockErc777Contract,
  getMockVaultContract,
  silenceConsoleOutput,
  deployRouterContract,
  SAMPLE_ETH_ADDRESS_1,
  SAMPLE_ETH_ADDRESS_2,
  keccakHashString,
  SAMPLE_USER_DATA,
  INTERIM_CHAIN_ID,
  EMPTY_DATA,
}
