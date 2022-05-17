// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IPTokensFees {
    // TODO This should take more information, origin & destination chain IDs, plus size of user data!
    // This way we can calcualte network fees for the ingress and egress chains, plus extra fees based
    // on size of user data.
    function calculateFee(
        address _tokenAddress,
        uint256 _amount,
        bool _isPegIn
    ) external view returns (uint256 feeAmount, uint256 amountMinusFee);

    function transferFees(
        uint256 _amount
    ) external view returns (bool success);
}
