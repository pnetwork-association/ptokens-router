// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IOriginChainIdGetter {
    function ORIGIN_CHAIN_ID() external returns (bytes4);
}
