pragma solidity ^0.4.24;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../node_modules/openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./MRC_Token.sol";


/**
 * @title MRC_CrowdsaleReservations
 * @dev Extension of MRC_Crowdsale where token reservations are implemented.
 */
contract MRC_CrowdsaleReservations is Ownable {
  using SafeMath for uint256;

  uint256 public reservationPercentsTeam = 14;
  uint256 public reservationPercentsBounty = 5;
  uint256 public reservationPercentsDevelopment = 15;
  uint256 public reservationPercentsSale = 1;

  uint256 public pendingReservationTeam;
  uint256 public pendingReservationBounty;
  uint256 public pendingReservationDevelopment;
  uint256 public pendingReservationSale;

  enum ReservePurpose {team, bounty, development, sale}

  /**
   * @dev Throws if address is 0.
   * @param _address Address to validate
   */
  modifier nonZeroAddressOnly(address _address) {
    require(_address != address(0), "address can not be 0");
    _;
  }

  /**
   * @dev Throws if reservation has been spent.
   * @param _reservePurpose Reservation purpose
   */
  modifier reservationPending(ReservePurpose _reservePurpose) {
    require(tokensReservedFor(_reservePurpose) > 0, "reserved tokens must be > 0");
    _;
  }

  event TeamReserveTransferred(address indexed _address, uint256 indexed _amount);
  event BountyReserveTransferred(address indexed _address, uint256 indexed _amount);
  event DevelopmentReserveTransferred(address indexed _address, uint256 indexed _amount);
  event SaleReserveTransferred(address indexed _address, uint256 indexed _amount);

  MRC_Token internal token;

  constructor (ERC20 _token) public {
    token = MRC_Token(_token);
    calculateTokenReservations();
  }
  
  /**
   * PUBLIC
   */
  
  /**
   * @dev Check token resravetion for different purposes.
   * @param _reservePurpose Reservation purpose
   * @return amount of reserver tokens for provided purpose
   */
  function tokensReservedFor(ReservePurpose _reservePurpose) public view returns(uint256) {
    if (_reservePurpose == ReservePurpose.team) {
      return pendingReservationTeam;
    } else if (_reservePurpose == ReservePurpose.bounty) {
      return pendingReservationBounty;
    } else if (_reservePurpose == ReservePurpose.development) {
      return pendingReservationDevelopment;
    } else if (_reservePurpose == ReservePurpose.sale) {
      return pendingReservationSale;
    }
  }

  /**
   * @dev Transfer tokens reserved for Team purpose.
   * @param _address Address to transfer
   */
  function transferReservationTeam(address _address) public
    onlyOwner
    nonZeroAddressOnly(_address)
    reservationPending(ReservePurpose.team) {
      uint256 tokens = tokensReservedFor(ReservePurpose.team);

      clearReservation(ReservePurpose.team);
      token.mint(_address, tokens);
      emit TeamReserveTransferred(_address, tokens);
  }

  /**
   * @dev Transfer tokens reserved for Bounty purpose.
   * @param _address Address to transfer
   */
  function transferReservationBounty(address _address) public
    onlyOwner
    nonZeroAddressOnly(_address)
    reservationPending(ReservePurpose.bounty) {
      uint256 tokens = tokensReservedFor(ReservePurpose.bounty);

      clearReservation(ReservePurpose.bounty);
      token.mint(_address, tokens);
      emit BountyReserveTransferred(_address, tokens);
  }

  /**
   * @dev Transfer tokens reserved for Development purpose.
   * @param _address Address to transfer
   */
  function transferReservationDevelopment(address _address) public
    onlyOwner
    nonZeroAddressOnly(_address)
    reservationPending(ReservePurpose.development) {
      uint256 tokens = tokensReservedFor(ReservePurpose.development);

      clearReservation(ReservePurpose.development);
      token.mint(_address, tokens);
      emit DevelopmentReserveTransferred(_address, tokens);
  }

  /**
   * @dev Transfer tokens reserved for Sale purpose.
   * @param _address Address to transfer
   */
  function transferReservationSale(address _address) public
    onlyOwner
    nonZeroAddressOnly(_address)
    reservationPending(ReservePurpose.sale) {
      uint256 tokens = tokensReservedFor(ReservePurpose.sale);
      
      clearReservation(ReservePurpose.sale);
      token.mint(_address, tokens);
      emit SaleReserveTransferred(_address, tokens);
  }


  /**
   * INTERNAL
   */

  /**
   * @dev Clears token reservation amount for provided purpose.
   * @param _reservePurpose Reservation purpose
   */
  function clearReservation(ReservePurpose _reservePurpose) internal {
    if (_reservePurpose == ReservePurpose.team) {
      pendingReservationTeam = 0;
    } else if (_reservePurpose == ReservePurpose.bounty) {
      pendingReservationBounty = 0;
    } else if (_reservePurpose == ReservePurpose.development) {
      pendingReservationDevelopment = 0;
    } else if (_reservePurpose == ReservePurpose.sale) {
      pendingReservationSale = 0;
    }
  } 


  /**
   * PRIVATE
   */

  /**
   * @dev Calculates reservation token amount based on provided percents.
   */
  function calculateTokenReservations() private {
    pendingReservationTeam = reservationPercentsTeam.mul(token.totalSupplyMax()).div(100);
    pendingReservationBounty = reservationPercentsBounty.mul(token.totalSupplyMax()).div(100);
    pendingReservationDevelopment = reservationPercentsDevelopment.mul(token.totalSupplyMax()).div(100);
    pendingReservationSale = reservationPercentsSale.mul(token.totalSupplyMax()).div(100);
  }
}
