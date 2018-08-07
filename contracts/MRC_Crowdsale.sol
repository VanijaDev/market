pragma solidity ^0.4.24;

import "../node_modules/openzeppelin-solidity/contracts/lifecycle/Pausable.sol";

import "./MRC_WhitelistedSourceDestination.sol";
import "./MRC_CrowdsaleReservations.sol";
import "./MRC_StagesCrowdsale.sol";
import "./MRC_Token.sol";


contract MRC_Crowdsale is MRC_StagesCrowdsale, Pausable, MRC_WhitelistedSourceDestination, MRC_CrowdsaleReservations {
  MRC_Token token;

  
  /**
   * @dev Constructor, takes crowdsale opening and closing times.
   * @param _rate                 Crowdsale token per ETH rate
   * @param _wallet               Crowdsale wallet
   * @param _token                Crowdsale token
   * @param _reservationPercents  Crowdsale res: [RESERVE_TEAM, RESERVE_BOUNTY, RESERVE_DEVELOPMENT, RESERVE_SALE_COST]
   * @param _timings              Crowdsale timings: [OPENING, ICO_START, CLOSING]
   */
  constructor(uint256 _rate, address _wallet, ERC20 _token, uint8[] _reservationPercents, uint256[] _timings) MRC_StagesCrowdsale(_rate, _wallet, _token, _timings) MRC_CrowdsaleReservations(_token) public {
    token = MRC_Token(_token);
    
    calculateTokenReservations(_reservationPercents, token.totalSupplyMax());
  }

  /**
   * PUBLIC
   */

  /**
   * @dev Owner can manually mint tokens to addresses.
   * @param _to Token beneficiary
   * @param _amount Token amount to be minted
   */
  function manualMint(address _to, uint256 _amount) public onlyOwner nonZeroAddressOnly(_to) {
    require(_amount > 0, "mint amount should be > 0");
    token.mint(_to, _amount);
  }

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
