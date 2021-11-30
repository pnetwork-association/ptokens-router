// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract MockInterimVault {
    bytes4 public  ORIGIN_CHAIN_ID;

    constructor(bytes4 originChainId) {
        ORIGIN_CHAIN_ID = originChainId;
    }
}
