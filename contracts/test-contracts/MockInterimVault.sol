// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC777/IERC777.sol";
import "@openzeppelin/contracts/token/ERC777/IERC777Recipient.sol";
import "@openzeppelin/contracts/utils/introspection/IERC1820Registry.sol";

pragma solidity ^0.8.0;

contract MockInterimVault is IERC777Recipient {
    bytes4 public  ORIGIN_CHAIN_ID;
    IERC1820Registry constant private ERC1820 = IERC1820Registry(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24);

    constructor(bytes4 originChainId) {
        ORIGIN_CHAIN_ID = originChainId;
        ERC1820.setInterfaceImplementer(address(this), keccak256("ERC777TokensRecipient"), address(this));
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
        IERC20(_tokenAddress).transferFrom(msg.sender, address(this), _tokenAmount);
        emit PegInCalled(_tokenAmount, _tokenAddress, _destinationAddress, _userData, _destinationChainId);
        return true;
    }

    function pegOut(
        address payable _tokenRecipient,
        address _tokenAddress,
        uint256 _tokenAmount,
        bytes calldata _userData
    )
        external
        returns (bool success)
    {
        IERC777(_tokenAddress).send(_tokenRecipient, _tokenAmount, _userData);
        return true;
    }

    function tokensReceived(
        address /* _operator */,
        address /* _from */,
        address _to,
        uint256 _amount,
        bytes calldata _userData,
        bytes calldata /* operatorData */
    )
        external
        override
    {
        require(_to == address(this), "Token receiver is not this contract");
        if (_userData.length > 0) {
            require(_amount > 0, "Token amount must be greater than zero!");
            (
                bytes32 tag,
                string memory _destinationAddress,
                bytes4 _destinationChainId,
                bytes memory userData
            ) = abi.decode(
                _userData,
                (bytes32, string, bytes4, bytes)
            );
            require(
                tag == keccak256("ERC777-pegIn"),
                "Invalid tag for automatic pegIn on ERC777 send"
            );
            emit PegInCalled(
                _amount,
                msg.sender,
                _destinationAddress,
                userData,
                _destinationChainId
            );
        }
    }
}
