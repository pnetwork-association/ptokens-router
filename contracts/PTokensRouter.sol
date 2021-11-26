// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./IVault.sol";
import "./IPToken.sol";
import "./ConvertStringToAddress.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/interfaces/IERC1820RegistryUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";

contract PTokensRouter is
    Initializable,
    ConvertStringToAddress,
    AccessControlEnumerableUpgradeable
{
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant REDEEMER_ROLE = keccak256("REDEEMER_ROLE");
    bytes32 public constant TOKENS_RECIPIENT_INTERFACE_HASH = keccak256("ERC777TokensRecipient");

    mapping(bytes4 => address) public interimVaultAddresses;
    mapping(bytes4 => mapping(address => address)) public destinationChainPTokenAddresses;

    function initialize ()
        public initializer
    {
        IERC1820RegistryUpgradeable(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24).setInterfaceImplementer(
            address(this),
            TOKENS_RECIPIENT_INTERFACE_HASH,
            address(this)
        );
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    modifier onlyAdmin() {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, _msgSender()) || hasRole(ADMIN_ROLE, _msgSender()),
            "Caller is not an admin!"
        );
        _;
    }

    modifier onlyMinter() {
        require(hasRole(ADMIN_ROLE, _msgSender()), "Caller is not a minter!");
        _;
    }

    modifier onlyRedeemer() {
        require(hasRole(ADMIN_ROLE, _msgSender()), "Caller is not a redeemer!");
        _;
    }

    function addVaultAddress(
        bytes4 _chainId,
        address _vaultAddress
    )
        external
        onlyAdmin
        returns (bool success)
    {
        interimVaultAddresses[_chainId] = _vaultAddress;
        return true;
    }

    function removeVaultAddress(
        bytes4 _chainId
    )
        external
        onlyAdmin
        returns (bool success)
    {
        delete interimVaultAddresses[_chainId];
        return true;
    }

    function addDestinationChainPTokenAddress(
        bytes4 _destinationChainId,
        address _interimPTokenAddress,
        address _pTokenAddress
    )
        external
        onlyAdmin
        returns (bool)
    {
        destinationChainPTokenAddresses[_destinationChainId][_interimPTokenAddress] = _pTokenAddress;
        return true;
    }

    function removeDestinationChainPTokenAddress(
        bytes4 _destinationChainId,
        address _interimPTokenAddress
    )
        external
        onlyAdmin
        returns (bool)
    {
        delete destinationChainPTokenAddresses[_destinationChainId][_interimPTokenAddress];
        return true;
    }

    function grantMinterRole(address _account) external {
        grantRole(MINTER_ROLE, _account);
    }

    function revokeMinterRole(address _account) external {
        revokeRole(MINTER_ROLE, _account);
    }

    function hasMinterRole(address _account) external view returns (bool) {
        return hasRole(MINTER_ROLE, _account);
    }

    function grantRedeemerRole(address _account) external {
        grantRole(REDEEMER_ROLE, _account);
    }

    function revokeRedeemerRole(address _account) external {
        revokeRole(REDEEMER_ROLE, _account);
    }

    function hasRedeemerRole(address _account) external view returns (bool) {
        return hasRole(REDEEMER_ROLE, _account);
    }

    function safelyGetInterimVaultAddress(
        bytes4 _destinationChainId
    )
        view
        public
        returns (address)
    {
        address vaultAddress =  interimVaultAddresses[_destinationChainId];
        require(vaultAddress != address(0), 'No vault address set for that chain ID'); // FIXME Divert instead?
        return vaultAddress;
    }

    // TODO test
    function safelyGetDestinationChainPTokenAddress(
        bytes4 _destinationChainId,
        address _interimPTokenAddress
    )
        view
        public
        returns (address)
    {
        address result = destinationChainPTokenAddresses[_destinationChainId][_interimPTokenAddress];
        require(result != address(0), 'No destination chain token token address set!'); // FIXME Divert instead?
        return result;
    }
}
