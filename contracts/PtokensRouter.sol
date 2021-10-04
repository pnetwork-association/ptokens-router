// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./IERC1820Registry.sol";
import "@openzeppelin/contracts/token/ERC777/IERC777Recipient.sol";

contract PTokensRouter is IERC777Recipient {
    IERC1820Registry private _erc1820 = IERC1820Registry(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24);
    bytes32 constant private TOKENS_RECIPIENT_INTERFACE_HASH = keccak256("ERC777TokensRecipient");

    constructor () {
        _erc1820.setInterfaceImplementer(address(this), TOKENS_RECIPIENT_INTERFACE_HASH, address(this));
    }

    function decodeMetadata(
        bytes memory metadata
    )
        public
        pure
        returns(
            bytes1 metadataVersion,
            bytes memory userData,
            bytes4 originChainId,
            address originAddress
        )
    {
        return abi.decode(metadata, (bytes1, bytes, bytes4, address));
    }

    function decodeUserDataToDestinationChainAndAddress(
        bytes memory userData
    )
        public
        pure
        returns(
            bytes4 destinationChain,
            address destinationAddress
        )
    {
        return abi.decode(userData, (bytes4, address));
    }

    function tokensReceived(
        address /*operator*/,
        address /*from*/,
        address /*to*/,
        uint256 /*amount*/,
        bytes calldata metadata,
        bytes calldata /*operatorData*/
    )
        external
        override
    {
        (
            bytes1 version,
            bytes memory userData,
            bytes4 originChainId,
            address originAddress
        ) = decodeMetadata(metadata);
        (
            bytes4 destinationChainId,
            address destinationAddress
        ) = decodeUserDataToDestinationChainAndAddress(userData);

        //..
        // Or, rather than just firing a boring event, do other cool things with your metadata instead!
        //..

    }
}
