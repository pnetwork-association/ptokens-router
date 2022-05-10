// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./interfaces/IPToken.sol";
import "./PTokensMetadataDecoder.sol";
import "./ConvertAddressToString.sol";
import "./interfaces/IOriginChainIdGetter.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/interfaces/IERC777.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/interfaces/IERC1820RegistryUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC777/IERC777RecipientUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";

interface IVault {
    function pegIn(
        uint256 _tokenAmount,
        address _tokenAddress,
        string memory _destinationAddress,
        bytes memory _userData,
        bytes4 _destinationChainId
    ) external returns (bool);
}

contract PTokensRouter is
    Initializable,
    PTokensMetadataDecoder,
    ConvertAddressToString,
    IERC777RecipientUpgradeable,
    AccessControlEnumerableUpgradeable
{
    address public SAFE_VAULT_ADDRESS;
    bytes4 public constant ORIGIN_CHAIN_ID = 0xffffffff;
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant TOKENS_RECIPIENT_INTERFACE_HASH = keccak256("ERC777TokensRecipient");
    mapping(bytes4 => address) public interimVaultAddresses;
    mapping(address => TokenFees) public tokenFees;
    uint256 public constant FEE_BASIS_POINTS_DIVISOR = 10000;
    address public FEE_SINK_ADDRESS;
    uint256 public MAX_FEE_BASIS_POINTS;

    struct TokenFees {
        uint256 pegInBasisPoints;
        uint256 pegOutBasisPoints;
    }

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
        if (getOriginChainIdFromContract(tokenAddress) == destinationChainId) {
            // NOTE: This is a full peg-out of tokens back to their native chain.
            (uint256 fee, uint256 amountMinusFee) = calculateFee(tokenAddress, _amount, false);
            IPToken(tokenAddress).redeem(
                amountMinusFee,
                userData,
                destinationAddress,
                destinationChainId
            );
        } else {
            // NOTE: This is either from a peg-in, or a peg-out to a different host chain.
            address vaultAddress = safelyGetVaultAddress(destinationChainId);
            (uint256 fee, uint256 amountMinusFee) = calculateFee(tokenAddress, _amount, true);
            IERC20(tokenAddress).approve(vaultAddress, _amount);
            IVault(vaultAddress).pegIn(
                amountMinusFee,
                tokenAddress,
                destinationAddress,
                userData,
                destinationChainId
            );
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
        TokenFees memory fees = TokenFees(_pegInBasisPoints, _pegOutBasisPoints);
        tokenFees[_tokenAddress] = fees;
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

    function calculateFee(
        address _tokenAddress,
        uint256 _amount,
        bool _isPegIn
    )
        public
        view
        returns(uint256 fee, uint256 amountMinusFee)
    {
        uint256 basisPoints = _isPegIn
            ? tokenFees[_tokenAddress].pegInBasisPoints
            : tokenFees[_tokenAddress].pegOutBasisPoints;
        if (basisPoints == 0) {
            return (0, _amount);
        }
        fee = _amount * basisPoints / FEE_BASIS_POINTS_DIVISOR;
        amountMinusFee = _amount - fee;
        return (fee, amountMinusFee);
    }
}
