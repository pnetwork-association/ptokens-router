// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC777/ERC777.sol";

contract MockInterimPToken is ERC777 {
    bytes4 public constant ORIGIN_CHAIN_ID = 0xd3adb33f;

    constructor() ERC777("ERC777", "ERC", new address[](0)) {
        _mint(msg.sender, 1000000, "", "");
    }
}
