// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./PTokensRouterTypes.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

contract PTokensFees is PTokensRouterTypes, AccessControlEnumerable {
    address public NETWORK_FEE_SINK_ADDRESS;
    address public NODE_OPERATORS_FEE_SINK_ADDRESS;

    uint256 public PEG_IN_BASIS_POINTS;
    uint256 public PEG_OUT_BASIS_POINTS;
    uint256 public MAX_FEE_BASIS_POINTS = 100;
    uint256 public FEE_BASIS_POINTS_DIVISOR = 10000;
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // NOTE: This allows an address to use a custom peg in fee.
    mapping(address => uint256) public CUSTOM_PEG_IN_FEES;

    // NOTE: This allows an address to use a custom peg out fee.
    mapping(address => uint256) public CUSTOM_PEG_OUT_FEES;


    struct Fees {
        // NOTE: A bridge crossing will have a fixed fee calculated from the USD rate of a token
        // multiplied by this multiplier. This way fees can be granular per bridge crossing,
        // since some crossings incur lower blockchain network fees than others.
        uint128 multiplier;

        // NOTE: This forms the percentage based component of the fees, used to to fund pNetwork
        // node operators.
        uint128 basisPoints;
    }

    // NOTE: This maps token addresses to an enum of fees for each bridge crossing possibility.
    mapping(address => mapping(BridgeCrossing => Fees)) BRIDGING_FEES;

    // NOTE: This maps a metadata chain ID to a USD exchange rate. This combined with the multiplier
    // in the Fee struct allows for very granular fee calculations that take into account ingress
    // and egress chain network fees.
    mapping(bytes4 => uint256) public USD_EXCHANGE_RATE;

    event LogFees(uint256 indexed feeAmount, uint256 indexed amountMinusFee);
    event LogCustomFeesSet(address indexed tokenAddress, uint256 basisPoints, bool isForPegIns);

    constructor(
        address _nodeOperatorsFeeSinkAddress,
        address _networkFeeSinkAddress,
        uint256 _pegInBasisPoints,
        uint256 _pegOutBasisPoints
    ) {
        NODE_OPERATORS_FEE_SINK_ADDRESS = _nodeOperatorsFeeSinkAddress;
        NETWORK_FEE_SINK_ADDRESS = _networkFeeSinkAddress;
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
        // TODO If we move to a more expensive chain, we can make this much cheaper by storing a fee
        // struct holding two smaller integers packed into one slot, and just read from that.

        // NOTE: Perversely, if you need a zero fee on one side of the bridge, you'll need to set the custom
        // fee of the _other_ side, even if that is to remain the default.
        if (CUSTOM_PEG_IN_FEES[_tokenAddress] == 0 && CUSTOM_PEG_OUT_FEES[_tokenAddress] == 0) {
            // NOTE: No custom fees are set for either peg-ins or -outs, so lets use the defaults...
            basisPoints = _isPegIn ? PEG_IN_BASIS_POINTS : PEG_OUT_BASIS_POINTS;
        } else {
            // NOTE: One or more custom fees are set, let's use those instead...
            basisPoints = _isPegIn ? CUSTOM_PEG_IN_FEES[_tokenAddress] : CUSTOM_PEG_OUT_FEES[_tokenAddress];
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
        IERC20(_tokenAddress).transferFrom(msg.sender, NODE_OPERATORS_FEE_SINK_ADDRESS, _tokenAmount);
        return true;
    }

    function setNodeOperatorsFeeSinkAddress(
        address _newAddress
    )
        external
        onlyAdmin
    {
        NODE_OPERATORS_FEE_SINK_ADDRESS = _newAddress;
    }

    function setNetworkFeeSinkAddress(
        address _newAddress
    )
        external
        onlyAdmin
    {
        NETWORK_FEE_SINK_ADDRESS = _newAddress;
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

    function setHostToHostFees(address _token, Fees calldata _feesToSet) onlyAdmin public {
        BRIDGING_FEES[_token][BridgeCrossing.HostToHost] = _feesToSet;
    }

    function setHostToNativeFees(address _token, Fees calldata _feesToSet) onlyAdmin public {
        BRIDGING_FEES[_token][BridgeCrossing.HostToNative] = _feesToSet;
    }

    function setNativeToHostFees(address _token, Fees calldata _feesToSet) onlyAdmin public {
        BRIDGING_FEES[_token][BridgeCrossing.NativeToHost] = _feesToSet;
    }

    function setNativeToNativeFees(address _token, Fees calldata _feesToSet) onlyAdmin public {
        BRIDGING_FEES[_token][BridgeCrossing.NativeToNative] = _feesToSet;
    }

    function setFees(
        address _token,
        Fees calldata _hostToHostFees,
        Fees calldata _hostToNativeFees,
        Fees calldata _nativeToHostFees,
        Fees calldata _nativeToNativeFees
    )
        public
        onlyAdmin
    {
        setHostToHostFees(_token, _hostToHostFees);
        setHostToNativeFees(_token, _hostToNativeFees);
        setNativeToHostFees(_token, _nativeToHostFees);
        setNativeToNativeFees(_token, _nativeToNativeFees);
    }

    function getHostToHostFees(address _token) public view returns (Fees memory) {
        return BRIDGING_FEES[_token][BridgeCrossing.HostToHost];
    }

    function getHostToNativeFees(address _token) public view returns (Fees memory) {
        return BRIDGING_FEES[_token][BridgeCrossing.HostToNative];
    }

    function getNativeToHostFees(address _token) public view returns (Fees memory) {
        return BRIDGING_FEES[_token][BridgeCrossing.NativeToHost];
    }

    function getNativeToNativeFees(address _token) public view returns (Fees memory) {
        return BRIDGING_FEES[_token][BridgeCrossing.NativeToNative];
    }

    function getFees(address _token)
        public
        view
        returns (
            Fees memory hostToHost,
            Fees memory hostToNative,
            Fees memory nativeToHost,
            Fees memory nativeToNative
        )
    {
        return (
            getHostToHostFees(_token),
            getHostToNativeFees(_token),
            getNativeToHostFees(_token),
            getNativeToNativeFees(_token)

        );
    }

    function setUsdExchangeRate(bytes4 _metadataChainId, uint256 _amount) external onlyAdmin {
        USD_EXCHANGE_RATE[_metadataChainId] = _amount;
    }

    function setMultiplierForToken(address _tokenAddress, uint128 _fee) external onlyAdmin {
        BRIDGING_FEES[_tokenAddress][BridgeCrossing.HostToHost].multiplier = _fee;
        BRIDGING_FEES[_tokenAddress][BridgeCrossing.HostToNative].multiplier = _fee;
        BRIDGING_FEES[_tokenAddress][BridgeCrossing.NativeToHost].multiplier = _fee;
        BRIDGING_FEES[_tokenAddress][BridgeCrossing.NativeToNative].multiplier = _fee;
    }
}
