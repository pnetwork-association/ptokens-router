// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IPTokensFees {
    function calculateAndTransferFee(
        address _tokenAddress,
        uint256 _amount,
        bool _isPegIn,
        bytes memory _userData,
        bytes4 _originChainId,
        bytes4 _destinationChainId,
        string memory _originAddress,
        string memory _destinationAddress
    ) external returns (uint256 amountMinusFee);

    enum BridgeCrossing { HostToHost, HostToNative, NativeToHost, NativeToNative }

    struct BasisPoints {
        uint8 hostToHost;
        uint8 hostToNative;
        uint8 nativeToHost;
        uint8 nativeToNative;
    }

    function MULTIPLIER(bytes4 metadataChainId) view external returns (uint256);
    function EXCHANGE_RATE(address tokenAddress) view external returns (uint256);
    function BASIS_POINTS(address tokenAddress) view external returns (BasisPoints memory);
}
