// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./IERC20Vault.sol";
import "./IERC1820Registry.sol";
import "@openzeppelin/contracts/token/ERC777/IERC777Recipient.sol";

contract AddressToString {
	function addressToString(address account) public pure returns(string memory) {
		return toString(abi.encodePacked(account));
	}

	function toString(bytes memory data) public pure returns(string memory) { // TODO Test
		bytes memory alphabet = "0123456789abcdef";

		bytes memory str = new bytes(2 + data.length * 2);
		str[0] = "0";
		str[1] = "x";
		for (uint i = 0; i < data.length; i++) {
			str[2+i*2] = alphabet[uint(uint8(data[i] >> 4))];
			str[3+i*2] = alphabet[uint(uint8(data[i] & 0x0f))];
		}
		return string(str);
	}
}

contract PTokensRouter is IERC777Recipient, AddressToString {
    IERC1820Registry private _erc1820 = IERC1820Registry(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24);
    bytes32 constant private TOKENS_RECIPIENT_INTERFACE_HASH = keccak256("ERC777TokensRecipient");
    mapping(bytes4 => address) public vaultAddresses;

    constructor () {
        _erc1820.setInterfaceImplementer(address(this), TOKENS_RECIPIENT_INTERFACE_HASH, address(this));
    }

    function decodeMetadata(
        bytes memory metadata
    )
        public
        pure
        returns(
            bytes1 metadataVersion,
            bytes memory userData,
            bytes4 originChainId,
            address originAddress
        )
    {
        return abi.decode(metadata, (bytes1, bytes, bytes4, address));
    }

    function decodeUserDataToDestinationChainAndAddress(
        bytes memory userData
    )
        public
        pure
        returns(
            bytes4 destinationChain,
            address destinationAddress
        )
    {
        return abi.decode(userData, (bytes4, address));
    }

    function getVaultAddressFromDestinationChainId( // TODO test
        bytes4 _destinationChainId
    )
        view
        internal
        returns (address)
    {
        address vaultAddress =  vaultAddresses[_destinationChainId];
        require(vaultAddress != address(0), 'No vault address set for that chain ID');
        // TODO divert to a safe address in the above case instead of reverting?
        return vaultAddress;
    }

    function addVaultAddress(
        bytes4 _chainId,
        address _vaultAddress
    )
        public
        returns (bool success)
        // TODO Only owner
    {
        vaultAddresses[_chainId] = _vaultAddress;
        return true;
    }

    function tokensReceived(
        address /*operator*/,
        address /*from*/,
        address /*to*/,
        uint256 amount,
        bytes calldata metadata,
        bytes calldata /*operatorData*/
    )
        external
        override
    {
        (, bytes memory userData, ,) = decodeMetadata(metadata);
        (
            bytes4 destinationChainId,
            address destinationAddress
        ) = decodeUserDataToDestinationChainAndAddress(userData);
        IERC20Vault vault = IERC20Vault(getVaultAddressFromDestinationChainId(destinationChainId));
        // NOTE: ∵ ETH metadata encodes the destination as an `address` type
        string memory destinationAddressStr = addressToString(destinationAddress);
        vault.pegIn(
            amount,
            msg.sender,
            destinationAddressStr,
            userData
        );
    }
}
