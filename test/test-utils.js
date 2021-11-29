const SAMPLE_USER_DATA = '0xd3caff'
const SAMPLE_METADATA_VERSION = '0x01'
const SAMPLE_METADATA_CHAIN_ID_1 = '0x00f34368' // NOTE: Rinkeby
const SAMPLE_METADATA_CHAIN_ID_2 = '0x0069c322' // NOTE: Ropstennini
const { encodeCoreMetadata } = require('../lib/metadata-encoder')
const SAMPLE_ETH_ADDRESS_1 = '0xfEDFe2616EB3661CB8FEd2782F5F0cC91D59DCaC'
const SAMPLE_ETH_ADDRESS_2 = '0xedB86cd455ef3ca43f0e227e00469C3bDFA40628'

const getSampleV1Metadata = _ =>
  encodeCoreMetadata('0x01', '0xd3caff', SAMPLE_METADATA_CHAIN_ID_1, SAMPLE_ETH_ADDRESS_1)

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

module.exports = {
  deployNonUpgradeableContract,
  SAMPLE_METADATA_CHAIN_ID_1,
  SAMPLE_METADATA_CHAIN_ID_2,
  SAMPLE_METADATA_VERSION,
  deployRouterContract,
  SAMPLE_ETH_ADDRESS_1,
  SAMPLE_ETH_ADDRESS_2,
  getSampleV1Metadata,
  SAMPLE_USER_DATA,
}
