// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./interfaces/IPToken.sol";
import "./PTokensRouterStorage.sol";
import "./PTokensMetadataDecoder.sol";
import "./ConvertAddressToString.sol";
import "./interfaces/IPTokensFees.sol";
import "./interfaces/IPTokensVault.sol";
import "./interfaces/IOriginChainIdGetter.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/interfaces/IERC1820RegistryUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC777/IERC777RecipientUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";

contract PTokensRouter is
    Initializable,
    PTokensMetadataDecoder,
    ConvertAddressToString,
    IERC777RecipientUpgradeable,
    AccessControlEnumerableUpgradeable,
    PTokensRouterStorage
{
    function initialize (
        address safeVaultAddress
    )
        public initializer
    {
        IERC1820RegistryUpgradeable(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24).setInterfaceImplementer(
            address(this),
            TOKENS_RECIPIENT_INTERFACE_HASH,
            address(this)
        );
        _setupRole(ADMIN_ROLE, _msgSender());
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        SAFE_VAULT_ADDRESS = safeVaultAddress;
    }

    modifier onlyAdmin() {
        require(
            hasRole(DEFAULT_ADMIN_ROLE, _msgSender()) || hasRole(ADMIN_ROLE, _msgSender()),
            "Caller is not an admin!"
        );
        _;
    }

    function updateSafeVaultAddress(
        address newSafeVaultAddress
    )
        external
        onlyAdmin
        returns (bool success)
    {
        SAFE_VAULT_ADDRESS = newSafeVaultAddress;
        return true;
    }

    function addVaultAddress(
        bytes4 _chainId,
        address _vaultAddress
    )
        external
        onlyAdmin
        returns (bool success)
    {
        interimVaultAddresses[_chainId] = _vaultAddress;
        return true;
    }

    function removeVaultAddress(
        bytes4 _chainId
    )
        external
        onlyAdmin
        returns (bool success)
    {
        delete interimVaultAddresses[_chainId];
        return true;
    }

    function getOriginChainIdFromContract(
        address _contractAddress
    )
        public
        returns (bytes4)
    {
        return IOriginChainIdGetter(_contractAddress).ORIGIN_CHAIN_ID();
    }

    function safelyGetVaultAddress(
        bytes4 chainId
    )
        view
        public
        returns (address vaultAddress)
    {
        vaultAddress = interimVaultAddresses[chainId];
        if (vaultAddress == address(0)) {
            return SAFE_VAULT_ADDRESS;
        } else {
            return vaultAddress;
        }
    }

    function decodeParamsFromUserData(
        bytes memory _userData
    )
        internal
        pure
        returns(bytes memory, bytes4, string memory)
    {
        if (_userData[0] == 0x02) {
            (
                , // NOTE: Metadata Version
                bytes memory userData,
                , // NOTE: Origin Chain Id
                , // NOTE: Origin Address
                bytes4 destinationChainId,
                address destinationAddress,
                ,
            ) = decodeMetadataV2(_userData);
            return (userData, destinationChainId, convertAddressToString(destinationAddress));
        } else if (_userData[0] == 0x03) {
            (
                , // NOTE: Metadata Version
                bytes memory userData,
                , // NOTE: Origin Chain Id
                , // NOTE: Origin Address
                bytes4 destinationChainId,
                string memory destinationAddress,
                ,
            ) = decodeMetadataV3(_userData);
            return (userData, destinationChainId, destinationAddress);
        } else {
            revert("Unrecognized pTokens metadata version!");
        }
    }

    function tokensReceived(
        address /* _operator */, // NOTE: Enclave address.
        address /* _from */, // NOTE: Enclave address.
        address /* _to */, // NOTE: This contract's address.
        uint256 _amount,
        bytes calldata _userData,
        bytes calldata /* _operatorData */
    )
        external
        override
    {
        (   bytes memory userData,
            bytes4 destinationChainId,
            string memory destinationAddress
        ) = decodeParamsFromUserData(_userData);
        address tokenAddress = msg.sender;

        // NOTE: We give the fee contract an allowance up to the total amount so that it can transfer fees...
        FEE_CONTRACT_ADDRESS != address(0) && IERC20(tokenAddress).approve(FEE_CONTRACT_ADDRESS, _amount);

        getOriginChainIdFromContract(tokenAddress) == destinationChainId
            ? pegOut( // NOTE: This is a full peg-out of tokens back to their native chain.
                _amount,
                tokenAddress,
                userData,
                destinationAddress,
                destinationChainId
            )
            : pegIn( // NOTE: This is either from a peg-in, or a peg-out to a different host chain.
                _amount,
                tokenAddress,
                userData,
                destinationChainId,
                destinationAddress
            );

        // NOTE: Finally, we revoke the fee contract's allowance.
        FEE_CONTRACT_ADDRESS != address(0) && IERC20(tokenAddress).approve(FEE_CONTRACT_ADDRESS, 0);
    }

    function pegOut(
        uint256 _amount,
        address _tokenAddress,
        bytes memory _userData,
        string memory _destinationAddress,
        bytes4 _destinationChainId
    )
        internal
    {
        IPToken(_tokenAddress).redeem(
            FEE_CONTRACT_ADDRESS != address(0)
                ? IPTokensFees(FEE_CONTRACT_ADDRESS).calculateAndTransferFee(_tokenAddress, _amount, false)
                : _amount,
            _userData,
            _destinationAddress,
            _destinationChainId
        );
    }

    function pegIn(
        uint256 _amount,
        address _tokenAddress,
        bytes memory _userData,
        bytes4 _destinationChainId,
        string memory _destinationAddress
    )
        internal
    {
        address vaultAddress = safelyGetVaultAddress(_destinationChainId);
        IERC20(_tokenAddress).approve(vaultAddress, _amount);
        IPTokensVault(vaultAddress).pegIn(
            FEE_CONTRACT_ADDRESS != address(0)
                ? IPTokensFees(FEE_CONTRACT_ADDRESS).calculateAndTransferFee(_tokenAddress, _amount, true)
                : _amount,
            _tokenAddress,
            _destinationAddress,
            _userData,
            _destinationChainId
        );
    }

    function setFeeContractAddress(
        address _feeContractAddress
    )
        external
        onlyAdmin
    {
        FEE_CONTRACT_ADDRESS = _feeContractAddress;
    }
}
