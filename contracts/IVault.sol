// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IVault {
    function pegIn(
        uint256 _tokenAmount,
        address _tokenAddress,
        string memory _destinationAddress,
        bytes4 _destinationChainId,
        bytes memory _userData
    ) external returns (bool);
}
