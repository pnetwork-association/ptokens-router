// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IPTokensVault {
    function pegIn(
        uint256 _tokenAmount,
        address _tokenAddress,
        string memory _destinationAddress,
        bytes memory _userData,
        bytes4 _destinationChainId
    ) external returns (bool);
}

