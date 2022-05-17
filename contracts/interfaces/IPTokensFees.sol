// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IPTokensFees {
    function calculateFee(
        uint256 _amount,
        bool _isPegIn
    ) external view returns (uint256 feeAmount, uint256 amountMinusFee);

    function transferFees(
        uint256 _tokenAmount,
        address _tokenAddress
    ) external view returns (bool success);
}
