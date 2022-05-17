// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./interfaces/IPToken.sol";
import "./PTokensRouterStorage.sol";
import "./PTokensMetadataDecoder.sol";
import "./ConvertAddressToString.sol";
import "./interfaces/IPTokensVault.sol";
import "./interfaces/IOriginChainIdGetter.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/interfaces/IERC777.sol";
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
        uint256 feeAmount;
        uint256 amountMinusFee;
        address tokenAddress = msg.sender;
        if (getOriginChainIdFromContract(tokenAddress) == destinationChainId) {
            // NOTE: This is a full peg-out of tokens back to their native chain.
            (feeAmount, amountMinusFee) = calculateFee(tokenAddress, _amount, false);
            IPToken(tokenAddress).redeem(
                amountMinusFee,
                userData,
                destinationAddress,
                destinationChainId
            );
        } else {
            // NOTE: This is either from a peg-in, or a peg-out to a different host chain.
            address vaultAddress = safelyGetVaultAddress(destinationChainId);
            (feeAmount, amountMinusFee) = calculateFee(tokenAddress, _amount, true);
            IERC20(tokenAddress).approve(vaultAddress, _amount);
            IPTokensVault(vaultAddress).pegIn(
                amountMinusFee,
                tokenAddress,
                destinationAddress,
                userData,
                destinationChainId
            );
        }
        // NOTE: Finally, if there are any, we deliver the fee amount to the fee sink address
        if (feeAmount > 0) {
            IERC20(tokenAddress).transfer(FEE_SINK_ADDRESS, feeAmount);
        }
    }

    function setFees(
        address _tokenAddress,
        uint256 _pegInBasisPoints,
        uint256 _pegOutBasisPoints
    )
        external
        onlyAdmin
    {
        TokenFees memory fees = TokenFees(
            sanityCheckBasisPoints(_pegInBasisPoints),
            sanityCheckBasisPoints(_pegOutBasisPoints)
        );
        tokenFees[_tokenAddress] = fees;
    }

    function setFeeContractAddress(
        address _tokenAddress,
        address _feeContractAddress
    )
        external
        onlyAdmin
    {
        tokenFeeContracts[_tokenAddress] = _feeContractAddress;
    }

    function setFeeSinkAddress(
        address _newFeeSinkAddress
    )
        external
        onlyAdmin
    {
        FEE_SINK_ADDRESS = _newFeeSinkAddress;
    }

    function setMaxFeeBasisPoints(
        uint256 _newMaxFeeBasisPoints
    )
        external
        onlyAdmin
    {
        MAX_FEE_BASIS_POINTS = _newMaxFeeBasisPoints;
    }

    function sanityCheckBasisPoints(
        uint256 _basisPoints
    )
        public
        view
        returns (uint256)
    {
        require(_basisPoints <= MAX_FEE_BASIS_POINTS, "Basis points value exceeds maximum!");
        return _basisPoints;
    }

    function calculateFee(
        address _tokenAddress,
        uint256 _amount,
        bool _isPegIn
    )
        public
        view
        returns(uint256 feeAmount, uint256 amountMinusFee)
    {
        uint256 basisPoints = _isPegIn
            ? tokenFees[_tokenAddress].pegInBasisPoints
            : tokenFees[_tokenAddress].pegOutBasisPoints;
        if (basisPoints == 0) {
            return (0, _amount);
        }
        feeAmount = _amount * basisPoints / FEE_BASIS_POINTS_DIVISOR;
        amountMinusFee = _amount - feeAmount;
        return (feeAmount, amountMinusFee);
    }
}
