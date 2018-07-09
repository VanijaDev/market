pragma solidity ^0.4.24;

import "../node_modules/openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "../node_modules/openzeppelin-solidity/contracts/crowdsale/Crowdsale.sol";

import "./MRC_WhitelistedSourceDestination.sol";
import "./MRC_Token.sol";


contract MRC_Crowdsale is Crowdsale, Pausable, MRC_WhitelistedSourceDestination {
  
  constructor(uint256 _rate, address _wallet, ERC20 _token) Crowdsale(_rate, _wallet, _token) public {
      
  }

  /**
   * PUBLIC
   */



  /**
   * OVERRIDEN
   */

   /**
   * @dev Extend parent behavior requiring beneficiary to be in whitelist.
   * @param _beneficiary Token beneficiary
   * @param _weiAmount Amount of wei contributed
   */
  function _preValidatePurchase(
    address _beneficiary,
    uint256 _weiAmount
  )
    internal
    isWhitelisted(_beneficiary)
  {
    super._preValidatePurchase(_beneficiary, _weiAmount);
  }



  /**
   * PRIVATE
   */
}
