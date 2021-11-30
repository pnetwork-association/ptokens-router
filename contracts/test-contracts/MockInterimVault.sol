// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract MockInterimVault {
    bytes4 public  ORIGIN_CHAIN_ID;

    constructor(bytes4 originChainId) {
        ORIGIN_CHAIN_ID = originChainId;
    }

    event PegInCalled(
        uint256 _tokenAmount,
        address _tokenAddress,
        string _destinationAddress,
        bytes _userData,
        bytes4 _destinationChainId
    );

    function pegIn(
        uint256 _tokenAmount,
        address _tokenAddress,
        string memory _destinationAddress,
        bytes memory _userData,
        bytes4 _destinationChainId
    )
        public
        returns (bool)
    {
        emit PegInCalled(_tokenAmount, _tokenAddress, _destinationAddress, _userData, _destinationChainId);
        return true;
    }
}
