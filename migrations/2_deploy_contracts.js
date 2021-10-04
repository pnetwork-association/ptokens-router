const { singletons } = require('@openzeppelin/test-helpers')
require('@openzeppelin/test-helpers/configure')({
  environment: 'truffle',
  provider: web3.currentProvider,
})

module.exports = async (_deployer, _network, _accounts) => {
  if (_network.includes('develop')) await singletons.ERC1820Registry(_accounts[0])
  const instance = await _deployer.deploy(artifacts.require('PTokensRouter'))
  console.info(`\nDeployed @ address ${instance.address}\n`)
}
