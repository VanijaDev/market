pragma solidity ^0.4.22;

import "../node_modules/openzeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "../node_modules/openzeppelin-solidity/contracts/crowdsale/validation/TimedCrowdsale.sol";

import "./MRC_Token.sol";


contract MRC_StagesCrowdsale is TimedCrowdsale {

  /**
   * @dev Constructor, takes crowdsale opening and closing times.
   * @param _rate     Crowdsale token per ETH rate
   * @param _wallet   Crowdsale wallet
   * @param _token    Crowdsale token
   * @param _timings  Crowdsale timings: [OPENING, ICO_START, CLOSING]
   */
  constructor(uint256 _rate, address _wallet, ERC20 _token, uint256[] _timings) 
    Crowdsale(_rate, _wallet, _token)
    TimedCrowdsale(_timings[0], _timings[2]) public {


  }
}
