// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

// NOTE: This contract exists to house the storage for the pTokens router. Since this
// contract is a proxy, we need to ensure the storage layout remains consistent.
// As such, this contract should be treated as append-only, and never re-ordered.

contract PTokensRouterStorage {
    address public SAFE_VAULT_ADDRESS;

    bytes4 public constant ORIGIN_CHAIN_ID = 0xffffffff;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    bytes32 public constant TOKENS_RECIPIENT_INTERFACE_HASH = keccak256("ERC777TokensRecipient");

    mapping(bytes4 => address) public interimVaultAddresses;

    mapping(address => TokenFees) public tokenFees; // FIXME rm!

    uint256 public constant FEE_BASIS_POINTS_DIVISOR = 10000; // FIXME rm!

    address public FEE_SINK_ADDRESS; // FIXME rm!

    uint256 public MAX_FEE_BASIS_POINTS; // FIXME rm!

    struct TokenFees { // FIXME rm!
        uint256 pegInBasisPoints;
        uint256 pegOutBasisPoints;
    }

    mapping(address => address) public tokenFeeContracts;
}
