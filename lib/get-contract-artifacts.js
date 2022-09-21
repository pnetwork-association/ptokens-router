const fs = require('fs')
const path = require('path')
const { getKeyFromObj } = require('./utils')

const ARTIFACT_OBJECT_NAME = 'Contract artifact'

const getFullPathToContractArtifact = _contractName =>
  path.resolve(__dirname, `../artifacts/contracts/PTokens${_contractName}.sol/PTokens${_contractName}.json`)

const getContractArtifact = _path =>
  new Promise((resolve, reject) => {
    const exists = fs.existsSync(_path)
    exists
      ? resolve(require(_path))
      : reject(new Error(`Artifact does not exist @ path '${_path}'! Run 'npx hardhat compile' to compile contracts!`))
  })

const getKeyFromContractArtifact = (_key, _contractName) =>
  getContractArtifact(getFullPathToContractArtifact(_contractName))
    .then(_artifact => getKeyFromObj(ARTIFACT_OBJECT_NAME, _artifact, _key))

const getFeeContractAbi = _ => getKeyFromContractArtifact('abi', 'Fees')
const getRouterContractAbi = _ => getKeyFromContractArtifact('abi', 'Router')
const getFeeContractBytecode = _ => getKeyFromContractArtifact('bytecode', 'Fees')
const getRouterContractBytecode = _ => getKeyFromContractArtifact('bytecode', 'Router')

module.exports = {
  getFeeContractAbi,
  getRouterContractAbi,
  getFeeContractBytecode,
  getRouterContractBytecode,
}
