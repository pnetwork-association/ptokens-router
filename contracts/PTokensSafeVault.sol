// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";

// NOTE: The "safe" vault is a stub of a vault to which tokens are sent by the router in the case
// that it can't determine the correct vault address for a given peg in. This safe vault has the
// `pegIn` function signature that the router expects, which function does nothing else. Also
// exposed is another function to move tokens owned by this vault on to wherever the caller wishes.

contract PTokensSafeVault is Ownable {

   event SafeVaultPegInCalled(
      uint256 tokenAmount,
      address tokenAddress,
      string destinationAddress,
      bytes userData,
      bytes4 destinationChainId
   );

   function pegIn(
      uint256 _tokenAmount,
      address _tokenAddress,
      string memory _destinationAddress,
      bytes memory _userData,
      bytes4 _destinationChainId
   ) external returns (bool) {
      emit SafeVaultPegInCalled(_tokenAmount, _tokenAddress, _destinationAddress, _userData, _destinationChainId);
      return true;
   }

   function transfer(
      address _tokenAddress,
      address _destinationAddress,
      uint256 _amount
   )
      external
      onlyOwner
      returns (bool)
   {
       IERC20(_tokenAddress).transfer(_destinationAddress, _amount);
       return true;
   }
}
