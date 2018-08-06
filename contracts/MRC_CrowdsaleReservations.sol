pragma solidity ^0.4.24;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../node_modules/openzeppelin-solidity/contracts/ownership/Ownable.sol";


/**
 * @title MRC_CrowdsaleReservations
 * @dev Extension of MRC_Crowdsale where token reservations are implemented.
 */
contract MRC_CrowdsaleReservations is Ownable {
  using SafeMath for uint256;

  enum ReservePurpose {team, bounty, development, sale}

  mapping(uint8 => uint256) private pendingReservations;

  modifier nonZeroAddressOnly(address _address) {
    require(_address != address(0), "address can not be 0");
    _;
  }

  modifier reservationExists(ReservePurpose _reservePurpose) {
    require(tokensReservedFor(_reservePurpose) > 0);
    _;
  }

  event TeamReserveTransferred(address indexed _address, uint256 indexed _amount);
  event BountyReserveTransferred(address indexed _address, uint256 indexed _amount);
  event DevelopmentReserveTransferred(address indexed _address, uint256 indexed _amount);
  event SaleReserveTransferred(address indexed _address, uint256 indexed _amount);

  function tokensReservedFor(ReservePurpose _reservePurpose) public view returns(uint256) {
    return pendingReservations[uint8(_reservePurpose)];
  }

  /**
   * INTERNAL
   */

  /**
   * @dev Calculates reservation token amount based on provided percents.
   * @param _reservationPercents Array of token reservation percantages:
   * 0 - team
   * 1 - bounty program
   * 2 - development fund
   * 3 - token sale cost
   */
  function calculateTokenReservations(uint8[] _reservationPercents, uint256 _totalSupplyMax) internal {
    for(uint8 i = 0; i < _reservationPercents.length; i ++) {
      require(_reservationPercents[i] > 0, "reserve must be > 0");

      pendingReservations[i] = uint256(_reservationPercents[i]).mul(_totalSupplyMax).div(100);
    }
  }

  function clearReservation(ReservePurpose _reservePurpose) internal onlyOwner reservationExists(_reservePurpose) {
    pendingReservations[uint8(_reservePurpose)] = 0;
  } 
}
