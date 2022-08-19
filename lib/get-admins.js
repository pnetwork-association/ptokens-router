const { getDeployedRouterContract } = require('./get-deployed-contract')
const { callReadOnlyFxnInContract } = require('./contract-utils')

const ADMIN_ROLE = '0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775'

const getAdmins = _deployedContractAddress =>
  getDeployedRouterContract(_deployedContractAddress)
    .then(_contract =>
      Promise.all([_contract, callReadOnlyFxnInContract('getRoleMemberCount', [ ADMIN_ROLE ], _contract)])
    )
    .then(([ _contract, _memberCount ]) =>
      Promise.all(
        new Array(_memberCount)
          .fill()
          .map((_, _i) => callReadOnlyFxnInContract('getRoleMember', [ ADMIN_ROLE, _i ], _contract))
      )
    )
    .then(console.table)

module.exports = { getAdmins }
