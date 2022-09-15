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
}
