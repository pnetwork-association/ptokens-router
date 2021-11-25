// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract PTokensMetadataDecoder {
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
}
