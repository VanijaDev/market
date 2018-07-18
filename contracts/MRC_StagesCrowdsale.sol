pragma solidity ^0.4.22;

import "../node_modules/openzeppelin-solidity/contracts/crowdsale/Crowdsale.sol";

import "./MRC_Token.sol";


contract MRC_StagesCrowdsale is Crowdsale {
  constructor(uint256 _rate, address _wallet, ERC20 _token, uint256[] _timings) Crowdsale(_rate, _wallet, _token) public {
  }
}
