pragma solidity ^0.4.22;

import "../node_modules/openzeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "../node_modules/openzeppelin-solidity/contracts/crowdsale/validation/TimedCrowdsale.sol";

import "./MRC_Token.sol";


contract MRC_StagesCrowdsale is TimedCrowdsale {
  constructor(uint256 _rate, address _wallet, ERC20 _token, uint256[] _timings) 
    Crowdsale(_rate, _wallet, _token)
    TimedCrowdsale(_timings[0], _timings[2]) public {
  }
}
