pragma solidity ^0.4.24;

import "../node_modules/openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "../node_modules/openzeppelin-solidity/contracts/token/ERC20/ERC20Basic.sol";
import "../node_modules/openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";


contract MRC_VestingEscrow is Ownable {
  using SafeMath for uint256;
  using SafeERC20 for ERC20Basic;

  ERC20Basic public token;

  struct VestingPortion {
    uint256 amount;
    bool released;
  }

  mapping (uint256 => VestingPortion) public vestingPortions;  //  timestamp => VestingPortion
  uint256[] public vestingPercents;
  uint256[] public vestingTimes;

  constructor(address _owner, ERC20Basic _token) public {
    require(_owner != address(0));
    owner = _owner;

    require(_token != address(0));
    token = _token;

//  TODO: client to verify below timestamps
    /**
     * Apr 30, 2019 @ 00:00 GMT 0
     * Aug 31, 2019 @ 00:00 GMT 0
     * Dec 31, 2019 @ 00:00 GMT 0
     * Apr 20, 2020 @ 00:00 GMT 0
     */
    // vestingTimes = [1556582400, 1567209600, 1577750400, 1587340800]; //  TODO: uncomment for release ver
    vestingTimes = [1538644471, 1538644571, 1538644671, 1538644871]; 
    vestingPercents = [20, 20, 30, 30];

    // calculateVestingPortions();
  }

  function calculateVestingPortions() public onlyOwner {
    require(vestingTimes.length == vestingPercents.length, "vestingTimes.length should be == vestingPercents.length");

    uint256 totalBalance = token.balanceOf(address(this));
    require(totalBalance > 0, "contaract does not own tokens");

    require(vestingPortions[0].amount == 0, "already calculated");
    
    for (uint256 i = 0; i < vestingPercents.length; i ++) {
      vestingPortions[vestingTimes[i]] = VestingPortion(totalBalance.mul(vestingPercents[i]).div(100), false);
    }
  }

  function vestTokens(address _to) public onlyOwner {
    require(token.balanceOf(address(this)) > 0, "no tokens on balance");

    uint256 tokens;

    for (uint256 i = 0; i < vestingTimes.length; i ++) {
      if (now >= vestingTimes[i]) {
        if (!vestingPortions[vestingTimes[i]].released) {
          tokens = tokens.add(vestingPortions[vestingTimes[i]].amount);
          vestingPortions[vestingTimes[i]].released = true;
        }
      } else {
        break;
      }
    }

    require(tokens > 0, "token amount must be > 0");

    token.safeTransfer(_to, tokens);
  }

}
