// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./IERC20Vault.sol";
import "./ConvertAddressToString.sol";
import "@openzeppelin/contracts/token/ERC777/IERC777Recipient.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/interfaces/IERC1820RegistryUpgradeable.sol";

contract PTokensRouter is
    Initializable,
    IERC777Recipient,
    OwnableUpgradeable,
    ConvertAddressToString
{
    IERC1820RegistryUpgradeable constant private _erc1820 = IERC1820RegistryUpgradeable(
        0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24
    );
    bytes32 constant private TOKENS_RECIPIENT_INTERFACE_HASH = keccak256("ERC777TokensRecipient");
    mapping(bytes4 => address) public vaultAddresses;

    function initialize ()
        public initializer
    {
        __Ownable_init();
        _erc1820.setInterfaceImplementer(address(this), TOKENS_RECIPIENT_INTERFACE_HASH, address(this));
    }

    function getVaultAddressFromDestinationChainId( // TODO test
        bytes4 _destinationChainId
    )
        view
        internal
        returns (address)
    {
        address vaultAddress =  vaultAddresses[_destinationChainId];
        require(vaultAddress != address(0), 'No vault address set for that chain ID');
        // TODO divert to a safe address in the above case instead of reverting?
        return vaultAddress;
    }

    function addVaultAddress(
        bytes4 _chainId,
        address _vaultAddress
    )
        external
        onlyOwner
        returns (bool success)
    {
        vaultAddresses[_chainId] = _vaultAddress;
        return true;
    }

    function removeVaultAddress(
        bytes4 _chainId
    )
        external
        onlyOwner
        returns (bool success)
    {
        delete vaultAddresses[_chainId];
        return true;
    }

    function tokensReceived(
        address /*operator*/,
        address /*from*/,
        address /*to*/,
        uint256 amount,
        bytes calldata metadata,
        bytes calldata /*operatorData*/
    )
        external
        override
    {
        (, bytes memory userData, ,) = decodeMetadata(metadata);
        (
            bytes4 destinationChainId,
            address destinationAddress
        ) = decodeUserDataToDestinationChainAndAddress(userData);
        address vaultAddress = getVaultAddressFromDestinationChainId(destinationChainId);
        IERC20Upgradeable interimToken = IERC20Upgradeable(msg.sender);
        interimToken.approve(vaultAddress, amount);
        // NOTE: ∵ ETH metadata encodes the destination as an `address` type
        string memory destinationAddressStr = convertAddressToString(destinationAddress);
        IERC20Vault vault = IERC20Vault(vaultAddress);
        vault.pegIn(amount, msg.sender, destinationAddressStr, userData);
    }
}
