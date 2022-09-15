// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

contract PTokensFees is AccessControlEnumerable {

    address public FEE_SINK_ADDRESS;
    uint256 public PEG_IN_BASIS_POINTS;
    uint256 public PEG_OUT_BASIS_POINTS;
    uint256 public MAX_FEE_BASIS_POINTS = 100;
    uint256 public FEE_BASIS_POINTS_DIVISOR = 10000;
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    mapping(address => bool) public CUSTOM_FEES;
    mapping(address => bool) public FEE_EXPCEPTIONS;

    event LogFees(uint256 indexed feeAmount, uint256 indexed amountMinusFee);

    constructor(
        address _feeSinkAddress,
        uint256 _pegInBasisPoints,
        uint256 _pegOutBasisPoints
    ) {
        FEE_SINK_ADDRESS = _feeSinkAddress;
        PEG_IN_BASIS_POINTS = _pegInBasisPoints;
        PEG_OUT_BASIS_POINTS = _pegOutBasisPoints;
        _setupRole(ADMIN_ROLE, _msgSender());
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    modifier onlyAdmin() {
       require(
          hasRole(DEFAULT_ADMIN_ROLE, _msgSender()) || hasRole(ADMIN_ROLE, _msgSender()),
          "Caller is not an admin!"
       );
       _;
    }

    function calculateAndTransferFee(
        address _tokenAddress,
        uint256 _amount,
        bool _isPegIn,
        bytes memory /* _userData */,
        bytes4 /* _originChainId*/,
        bytes4 /* _destinationChainId */,
        string memory /* _originAddress */,
        string memory /* _destinationAddress */
    )
        public
        returns (uint256 amountMinusFee)
    {
        uint256 feeAmount;
        (feeAmount, amountMinusFee) = calculateFee(_isPegIn, _amount, _tokenAddress);
        emit LogFees(feeAmount, amountMinusFee);
        feeAmount > 0 && transferFeeToFeeSinkAddress(feeAmount, _tokenAddress);
        return amountMinusFee;
    }

    function calculateFee(
        bool _isPegIn,
        uint256 _amount,
        address _tokenAddress
    )
        public
        view
        returns (uint256 feeAmount, uint256 amountMinusFee)
    {
        uint256 basisPoints = _isPegIn ? PEG_IN_BASIS_POINTS : PEG_OUT_BASIS_POINTS;
        if (basisPoints == 0 || FEE_EXPCEPTIONS[_tokenAddress]) {
            return (0, _amount);
        }
        feeAmount = _amount * basisPoints / FEE_BASIS_POINTS_DIVISOR;
        amountMinusFee = _amount - feeAmount;

        return (feeAmount, amountMinusFee);
    }

    function    transferFeeToFeeSinkAddress(
        uint256 _tokenAmount,
        address _tokenAddress
    )
        public
        returns (bool success)
    {
        IERC20(_tokenAddress).transferFrom(msg.sender, FEE_SINK_ADDRESS, _tokenAmount);
        return true;
    }

    function setFeeSinkAddress(
        address _newFeeSinkAddress
    )
        external
        onlyAdmin
    {
        FEE_SINK_ADDRESS = _newFeeSinkAddress;
    }

    function setPegInBasisPoints(
        uint256 _newBasisPoints
    )
        external
        onlyAdmin
    {
        PEG_IN_BASIS_POINTS = sanityCheckBasisPoints(_newBasisPoints);
    }

    function setPegOutBasisPoints(
        uint256 _newBasisPoints
    )
        external
        onlyAdmin
    {
        PEG_OUT_BASIS_POINTS = sanityCheckBasisPoints(_newBasisPoints);
    }

    function setMaxFeeBasisPoints(
        uint256 _maxFeeBasisPoints
    )
        external
        onlyAdmin
    {
        MAX_FEE_BASIS_POINTS = _maxFeeBasisPoints;
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

    function addFeeException(
        address _address
    )
        public
        onlyAdmin
        returns (bool success)
    {
        if (!FEE_EXPCEPTIONS[_address]) {
            FEE_EXPCEPTIONS[_address] = true;
        }
        return true;
    }

    function removeFeeException(
        address _address
    )
        public
        onlyAdmin
        returns (bool success)
    {
        if(FEE_EXPCEPTIONS[_address]) {
            FEE_EXPCEPTIONS[_address] = false;
        }
        return true;
    }
}
