const hre = require('hardhat')

const main = _ =>
  hre.storageLayout.export().then(console.info)

main()
