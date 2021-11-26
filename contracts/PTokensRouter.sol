// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "hardhat/console.sol"; // FIXME rm!

import "./interfaces/IVault.sol";
import "./interfaces/IPToken.sol";
import "./PTokensMetadataDecoder.sol";
import "./ConvertStringToAddress.sol";
import "./interfaces/IOriginChainIdGetter.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/interfaces/IERC1820RegistryUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC777/IERC777RecipientUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";

contract PTokensRouter is
    Initializable,
    PTokensMetadataDecoder,
    ConvertStringToAddress,
    IERC777RecipientUpgradeable,
    AccessControlEnumerableUpgradeable
{
    bytes4 public constant ORIGIN_CHAIN_ID = 0xff000000;
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant TOKENS_RECIPIENT_INTERFACE_HASH = keccak256("ERC777TokensRecipient");
    mapping(bytes4 => address) public interimVaultAddresses;

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

    function getOriginChainIdFromContract(
        address _contractAddress
    )
        public
        returns (bytes4)
    {
        return IOriginChainIdGetter(_contractAddress).ORIGIN_CHAIN_ID();
    }

    function callerIsInterimVault(
        address _caller
    )
        public
        returns (bool)
    {
        return getOriginChainIdFromContract(_caller) == ORIGIN_CHAIN_ID;
    }


    function callerIsInterimPToken(
        address _caller
    )
        public
        returns (bool)
    {
        return !callerIsInterimVault(_caller);
    }

    function tokensReceived(
        address /*_operator*/,
        address _from,
        address _to,
        uint256 _amount,
        bytes calldata _userData,
        bytes calldata /*_operatorData*/
    )
        external
        override
    {
        if (callerIsInterimPToken(msg.sender)) {
            return;
        } else if (callerIsInterimVault(msg.sender)) {
            return;
        } else {
            return; // FIXME What to do in this case?
        }
    }
}
