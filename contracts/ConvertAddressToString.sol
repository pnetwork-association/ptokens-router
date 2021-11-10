// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

contract ConvertAddressToString {
    function toString(bytes memory data) public pure returns(string memory) {
       bytes memory hexChars = "0123456789abcdef";

       bytes memory str = new bytes(2 + data.length * 2);
       str[0] = "0";
       str[1] = "x";
       for (uint i = 0; i < data.length; i++) {
               str[2+i*2] = hexChars[uint(uint8(data[i] >> 4))];
               str[3+i*2] = hexChars[uint(uint8(data[i] & 0x0f))];
       }
       return string(str);
    }

    function convertAddressToString(address account) public pure returns(string memory) {
        return toString(abi.encodePacked(account));
    }
}
