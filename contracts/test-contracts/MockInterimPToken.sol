// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC777/ERC777.sol";

contract MockInterimPToken is ERC777 {
    bytes4 public ORIGIN_CHAIN_ID;

    constructor(bytes4 originChainId) ERC777("ERC777", "ERC", new address[](0)) {
        _mint(msg.sender, 1000000, "", "");
        ORIGIN_CHAIN_ID = originChainId;
    }

    event RedeemCalled(
        uint256 amount,
        bytes userData,
        string underlyingAssetRecipient,
        bytes4 destinationChainId
    );

    function redeem(
        uint256 amount,
        bytes memory userData,
        string memory underlyingAssetRecipient,
        bytes4 destinationChainId
    )
        public
    {
        _burn(_msgSender(), amount, userData, "");
        emit RedeemCalled(amount, userData, underlyingAssetRecipient, destinationChainId);
    }
}
