// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../libraries/PTokensTypes.sol";

interface IPTokensFees {
    function calculateAndTransferFee(
        address _tokenAddress,
        uint256 _amount,
        PTokensTypes.BridgeCrossing _crossing,
        bytes memory _userData,
        bytes4 _originChainId,
        bytes4 _destinationChainId,
        string memory _originAddress,
        string memory _destinationAddress
    ) external returns (uint256 amountMinusFee);
}
