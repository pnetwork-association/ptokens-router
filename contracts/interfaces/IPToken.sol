// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IPToken {
    function approve(
        address spender,
        uint256 value
    ) external;

    function mint(
        address recipient,
        uint256 value,
        bytes memory userData,
        bytes memory operatorData
    ) external returns (bool);

    function redeem(
        uint256 amount,
        bytes memory userData,
        string memory underlyingAssetRecipient,
        bytes4 destinationChainId
    ) external;
}
