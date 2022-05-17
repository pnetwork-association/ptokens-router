// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IPTokensFees {
    function calculateAndTransferFee(
        address _tokenAddress,
        uint256 _amount,
        bool _isPegIn
    ) external returns (uint256 amountMinusFee);
}
