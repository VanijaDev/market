pragma solidity ^0.4.24;

import "../node_modules/openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "../node_modules/openzeppelin-solidity/contracts/crowdsale/Crowdsale.sol";

import "./MRC_WhitelistedSourceDestination.sol";
import "./MRC_CrowdsaleReservations.sol";
import "./MRC_Token.sol";


contract MRC_Crowdsale is Crowdsale, Pausable, MRC_WhitelistedSourceDestination, MRC_CrowdsaleReservations {
  MRC_Token token;

  
  constructor(uint256 _rate, address _wallet, ERC20 _token, uint8[] _reservationPercents) Crowdsale(_rate, _wallet, _token) public {
    token = MRC_Token(_token);
    calculateTokenReservations(_reservationPercents, token.totalSupplyMax());
  }

  /**
   * PUBLIC
   */

  //  reservation transfers
  function transferTeamReservation(address _address) public
    onlyOwner
    nonZeroAddressOnly(_address)
    reservationExists(MRC_CrowdsaleReservations.ReservePurpose.team) {
      uint256 teamTokensReserve = tokensReservedFor(MRC_CrowdsaleReservations.ReservePurpose.team);
      clearReservation(MRC_CrowdsaleReservations.ReservePurpose.team);

      token.mint(_address, teamTokensReserve);
      emit TeamReserveTransfered(_address, teamTokensReserve);
  }

  function transferBountyReservation(address _address) public
    onlyOwner
    nonZeroAddressOnly(_address)
    reservationExists(MRC_CrowdsaleReservations.ReservePurpose.bounty) {
      uint256 bountyTokensReserve = tokensReservedFor(MRC_CrowdsaleReservations.ReservePurpose.bounty);
      clearReservation(MRC_CrowdsaleReservations.ReservePurpose.bounty);

      token.mint(_address, bountyTokensReserve);
      emit BountyReserveTransfered(_address, bountyTokensReserve);
  }

  function transferDevelopmentReservation(address _address) public
    onlyOwner
    nonZeroAddressOnly(_address)
    reservationExists(MRC_CrowdsaleReservations.ReservePurpose.development) {
      uint256 developmentTokensReserve = tokensReservedFor(MRC_CrowdsaleReservations.ReservePurpose.development);
      clearReservation(MRC_CrowdsaleReservations.ReservePurpose.development);

      token.mint(_address, developmentTokensReserve);
      emit DevelopmentReserveTransfered(_address, developmentTokensReserve);
  }

  function transferSaleReservation(address _address) public
    onlyOwner
    nonZeroAddressOnly(_address)
    reservationExists(MRC_CrowdsaleReservations.ReservePurpose.sale) {
      uint256 saleTokensReserve = tokensReservedFor(MRC_CrowdsaleReservations.ReservePurpose.sale);
      clearReservation(MRC_CrowdsaleReservations.ReservePurpose.sale);

      token.mint(_address, saleTokensReserve);
      emit SaleReserveTransfered(_address, saleTokensReserve);
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
