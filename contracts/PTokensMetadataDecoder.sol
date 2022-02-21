// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract PTokensMetadataDecoder {
    function decodeMetadataV1(
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

    function decodeMetadataV2(
        bytes memory metadata
    )
        public
        pure
        returns(
            bytes1 metadataVersion,
            bytes memory userData,
            bytes4 originChainId,
            address originAddress,
            bytes4 destinationChainId,
            address destinationAddress,
            bytes memory protocolOptions,
            bytes memory protocolReceipt
        )
    {
        return abi.decode(metadata, (bytes1, bytes, bytes4, address, bytes4, address, bytes, bytes));
    }
}
