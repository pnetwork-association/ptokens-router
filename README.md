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
  cli.js deployContract
  cli.js getOwner <deployedAddress>
  cli.js transferOwner <deployedAddress> <ethAddress>
  cli.js verifyContract <deployedAddress> <network>
  cli.js removeVaultAddress <deployedAddress> <chainId>
  cli.js addVaultAddress <deployedAddress> <chainId> <ethAddress>

❍ Commands:
  deployContract        ❍ Deploy the logic contract.
  verifyContract        ❍ Verify the logic contract.
  getOwner              ❍ Get the owner of the contract at <deployedAddress>.
  transferOwner         ❍ Transfer ownership of contract at <deployedAddress> to <ethAddress>.
  removeVaultAddress    ❍ Removess vault address with <chainId> from <deployedAddress>.
  addVaultAddress       ❍ Adds <ethAddress> as vault address with <chainId> to <deployedAddress>.

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

## :white_medium_square: To Do:

[ ] Allow custom gas prices?
[ ] Add tests for non-gsn version?
