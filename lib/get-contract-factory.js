const {
  getFeeContractAbi,
  getRouterContractAbi,
  getFeeContractBytecode,
  getRouterContractBytecode,
} = require('./get-contract-artifacts')
/* eslint-disable-next-line no-shadow */
const ethers = require('ethers')

const getContractFactory = (_abi, _bytecode, _wallet) =>
  Promise.resolve(new ethers.ContractFactory(_abi, _bytecode, _wallet))

const getPTokenContractFactory = _wallet =>
  Promise.all([ getRouterContractAbi(), getRouterContractBytecode() ])
    .then(([ _abi, _bytecode ]) => getContractFactory(_abi, _bytecode, _wallet))

const getFeeContractFactory = _wallet =>
  Promise.all([ getFeeContractAbi(), getFeeContractBytecode() ])
    .then(([ _abi, _bytecode ]) => getContractFactory(_abi, _bytecode, _wallet))

module.exports = {
  getPTokenContractFactory,
  getFeeContractFactory,
}
