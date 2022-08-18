# :page_with_curl: Provable pToken Router Smart Contract

This repo houses the Provable __pToken__ v2 upgradeable Router logic smart-contract, as well as a simple CLI to help with deployment of, verification of & interacting with it.

&nbsp;

## :boom: Usage Guide:

After cloning the repository, first install the dependencies:

```
> npm ci
```

Then, to see the usage guide, run:

```
> ./cli.js --help
```

Output:

```

❍ pTokens Router Contract Command Line Interface

  Copyright Provable Things 2021
  Questions: greg@oraclize.it

❍ Info:

  A tool to aid with deployments of & interactions with the upgradeable pToken Router logic contract.

  NOTE: Functions that make transactions require a private key. Please provide a GPG encrpyted file called
   'private-key.gpg' containing your key in the root of the repository. Create one via:
   'echo <your-private-key> | gpg -c --output private-key.gpg'

  NOTE: The tool requires a '.env' file to exist in the root of the repository with the following info:
    ENDPOINT=<rpc-endpoint-for-blochain-to-interact-with>

  NOTE: To call the 'verifyContract' function, the following extra environment variable is required:
    ETHERSCAN_API_KEY=<api-key-for-automated-contract-verifications>

❍ Usage:
  cli.js --help
  cli.js --version
  cli.js showWalletDetails
  cli.js deployRouterContract
  cli.js showExistingContracts
  cli.js getAdmins <deployedAddress>
  cli.js encodeInitArgs <ethAddress>
  cli.js getSafeVaultAddress <deployedAddress>
  cli.js verifyContract <network> <deployedAddress>
  cli.js getVaultAddress <deployedAddress> <chainId>
  cli.js removeVaultAddress <deployedAddress> <chainId>
  cli.js addVaultAddress <deployedAddress> <chainId> <ethAddress>

❍ Commands:
  deployRouterContract        ❍ Deploy the logic contract.
  verifyContract        ❍ Verify the logic contract.
  getAdmins             ❍ Get the admins of the contract at <deployedAddress>.
  removeVaultAddress    ❍ Removess vault address with <chainId> from <deployedAddress>.
  getVaultAddress       ❍ Get vault address from router at <deployedAddress> via <chainId>.
  showWalletDetails     ❍ Decrypts the private key and shows address & balance information.
  getSafeVaultAddress   ❍ Get the safe vault address set in the router at <deployedAddress>.
  encodeInitArgs        ❍ Calculate the initializer function arguments in ABI encoded format.
  addVaultAddress       ❍ Adds <ethAddress> as vault address with <chainId> to <deployedAddress>.
  showExistingContracts ❍ Show list of existing pToken logic contract addresses on various blockchains.


❍ Options:
  --help                ❍ Show this message.
  --version             ❍ Show tool version.
  <ethAddress>          ❍ A valid ETH address.
  <deployedAddress>     ❍ The ETH address of the deployed pToken.
  <chainId>             ❍ A pToken metadata chain ID, as a 'bytes4' solidity type.
  <network>             ❍ Network the contract is deployed on. It must exist in the 'hardhat.config.json'.

```

&nbsp;

### :radioactive: Secrets:

This tool requires a private key in order to sign transactions. GPG is used to protect the private key. To encrypt a private key using a GPG key from your keyring:

```
echo <your-private-key> | gpg -e --output private-key.gpg
```

Or, if you'd rather use a password to encrypt your keyfile, use this instead:

```
echo <your-private-key> | gpg -c --output private-key.gpg
```

The CLI also requires a JsonRPC endpoint for the blockchain you're interacting with. To easily provision this, create a `.env` file in the root of the repository and fill it in thusly:

```
ENDPOINT=<ethRpcEndpoint>
```

Finally, to verify a contract, you'll need an etherscan API key too. You can add this to your `.env` file thusly:

```
ETHERSCAN_API_KEY=<apikey>
```

NOTE: If you're not verifying contracts, you don't need to provide this environment variable at all.

&nbsp;

### :black_nib: Notes:

 - To simplify deployments, the tool uses __`ethers.js`__ suggested fees for deployment. The CLI function __`showSuggestedFees`__ will show you the currently suggested fees, including __[EIP1559](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1559.md)__ specific values if the chain you're working with is EIP1559 compaible.

 - In case the chain you're deploying to does not have etherscan-style contract verification which works with the hardhat plugin, there exists the __`flattenContract`__ command. This will flatten the __`pToken`__ contract into a single __`.sol`__ file that can then be used for manual verification.

&nbsp;

### :guardsman: Tests:

1) Install dependencies:

```
❍ npm ci
```

2) Run the tests:

```
❍ npm run tests
```

Test output:

```

  Convert Address To String
    ✓ Should convert address type to string correctly (1018ms)

  Metadata Encoder
    ✓ Should encode metadata
    ✓ Should encode user data
    ✓ Should encode user data in metadata

  pTokens Router Contract
    Ownership tests...
      ✓ Owner can add vault addresses
      ✓ Owner can remove vault addresses
      ✓ Non owner cannot add vault addresses (38ms)
      ✓ Non owner cannot add vault addresses (40ms)
    Metadata decoding tests...
      ✓ Should decode metadata...
      ✓ Should decode userdata to destination chain and address...


  10 passing (2s)

```

&nbsp;

## :robot: Metadata Chain Ids

Here is a list of the metadata chain IDs currently supported by the core. Additinally, the file definining them can be found in [the pTokens core repository here](https://github.com/provable-things/ptokens-core-private/blob/8f85f85948c8e1ade055a7d29422cc7c079e9016/src/metadata/metadata_chain_id.rs#L17).

```
pub enum MetadataChainId {
    EthereumMainnet,  // 0x005fe7f9
    EthereumRopsten,  // 0x0069c322
    EthereumRinkeby,  // 0x00f34368
    BitcoinMainnet,   // 0x01ec97de
    BitcoinTestnet,   // 0x018afeb2
    EosMainnet,       // 0x02e7261c
    TelosMainnet,     // 0x028c7109
    BscMainnet,       // 0x00e4b170
    EosJungleTestnet, // 0x0282317f
    XDaiMainnet,      // 0x00f1918e
    PolygonMainnet,   // 0x0075dd4c
    UltraMainnet,     // 0x025d3c68
    FioMainnet,       // 0x02174f20
    UltraTestnet,     // 0x02b5a4d6
    EthUnknown,       // 0x00000000
    BtcUnknown,       // 0x01000000
    EosUnknown,       // 0x02000000
    InterimChain,     // 0xffffffff
    FantomMainnet,    // 0x0022af98
    ArbitrumMainnet,  // 0x00ce98c4
    LuxochainMainnet, // 0x00d5beb0
}
```

&nbsp;

## :white_medium_square: To Do:

[ ] Allow custom gas prices?
[ ] Add tests for non-gsn version?
