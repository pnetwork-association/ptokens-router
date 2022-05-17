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

    mapping(address => address) public feeContracts;
}
