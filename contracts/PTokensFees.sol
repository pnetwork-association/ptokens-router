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

    mapping(address => bool) public FEE_EXPCEPTIONS;
    mapping(address => address) public CUSTOM_FEE_CONTRACTS;

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

    // TODO This should take more information, origin & destination chain IDs, plus size of user data!
    // This way we can calcualte network fees for the ingress and egress chains, plus extra fees based
    // on size of user data.
    // TODO test
    function calculateAndTransferFee(
        address _tokenAddress,
        uint256 _amount,
        bool _isPegIn
    )
        public
        returns (uint256 amountMinusFee)
    {
        uint256 feeAmount;
        (feeAmount, amountMinusFee) = calculateFee(_amount, _isPegIn);
        transferAmount(feeAmount, _tokenAddress);
        return amountMinusFee;
    }

    function calculateFee(
        uint256 _amount,
        bool _isPegIn
    )
        public
        view
        returns (uint256 feeAmount, uint256 amountMinusFee)
    {
        uint256 basisPoints = _isPegIn ? PEG_IN_BASIS_POINTS : PEG_OUT_BASIS_POINTS;
        if (basisPoints == 0) {
            return (0, _amount);
        }
        feeAmount = _amount * basisPoints / FEE_BASIS_POINTS_DIVISOR;
        amountMinusFee = _amount - feeAmount;
        return (feeAmount, amountMinusFee);
    }

    // TODO test
    function    transferAmount(
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
