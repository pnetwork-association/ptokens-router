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

    // NOTE: This allows fees to be skipped entirely for a given address
    mapping(address => bool) public FEE_EXPCEPTIONS;

    // NOTE: This allows an address to use a custom peg in fee.
    mapping(address => uint256) public CUSTOM_PEG_IN_FEES;

    // NOTE: This allows an address to use a custom peg out fee.
    mapping(address => uint256) public CUSTOM_PEG_OUT_FEES;

    event LogFees(uint256 indexed feeAmount, uint256 indexed amountMinusFee);
    event LogCustomFeesSet(address indexed tokenAddress, uint256 basisPoints, bool isForPegIns);

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

    function getFeeBasisPoints(
        bool _isPegIn,
        address _tokenAddress
    )
        public
        view
        returns (uint256 basisPoints)
    {
        // NOTE: Check if there are custom fees set for this token address...
        if (_isPegIn) {
            basisPoints = CUSTOM_PEG_IN_FEES[_tokenAddress] == 0
                ? PEG_IN_BASIS_POINTS
                : CUSTOM_PEG_IN_FEES[_tokenAddress];
        } else {
            basisPoints = CUSTOM_PEG_OUT_FEES[_tokenAddress] == 0
                ? PEG_OUT_BASIS_POINTS
                : CUSTOM_PEG_OUT_FEES[_tokenAddress];
        }

        // NOTE: Check if there is an exception for fees for this token address. This overrules the above
        // and results in zero fees being take for either peg-ins or -outs.
        if (FEE_EXPCEPTIONS[_tokenAddress]) {
            basisPoints = 0;
        }

        return basisPoints;
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
        uint256 basisPoints = getFeeBasisPoints(_isPegIn, _tokenAddress);

        if (basisPoints == 0) {
            return (0, _amount);
        } else {
            feeAmount = _amount * basisPoints / FEE_BASIS_POINTS_DIVISOR;
            amountMinusFee = _amount - feeAmount;
            return (feeAmount, amountMinusFee);
        }
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

    function setCustomFee(
        address _tokenAddress,
        uint256 _basisPoints,
        bool _isPegIn
    )
        internal
        returns (bool success)
    {
        if (_isPegIn) {
            CUSTOM_PEG_IN_FEES[_tokenAddress] = _basisPoints;
        } else {
            CUSTOM_PEG_OUT_FEES[_tokenAddress] = _basisPoints;
        }
        emit LogCustomFeesSet(_tokenAddress,  _basisPoints, _isPegIn);
        return true;
    }

    function setCustomPegInFee(
        address _tokenAddress,
        uint256 _basisPoints
    )
        public
        onlyAdmin
        returns (bool success)
    {
        return setCustomFee(_tokenAddress, _basisPoints, true);
    }

    function setCustomPegOutFee(
        address _tokenAddress,
        uint256 _basisPoints
    )
        public
        onlyAdmin
        returns (bool success)
    {
        return setCustomFee(_tokenAddress, _basisPoints, false);
    }
}
