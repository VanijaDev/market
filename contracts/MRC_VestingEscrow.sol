pragma solidity ^0.4.24;

import "../node_modules/openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "../node_modules/openzeppelin-solidity/contracts/token/ERC20/ERC20Basic.sol";
import "../node_modules/openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";


contract MRC_VestingEscrow is Ownable {
  using SafeMath for uint256;
  using SafeERC20 for ERC20Basic;

  ERC20Basic public token;

  mapping (uint256 => uint256) public minimumContractBalance;  //  timestamp => minimumContractBalance
  uint256[] public vestingPercents;
  uint256[] public vestingTimes;

  constructor(ERC20Basic _token) public {
    require(_token != address(0));
    token = _token;

//  TODO: client to verify below timestamps
    /**
     * Apr 30, 2019 @ 00:00 GMT 0
     * Aug 31, 2019 @ 00:00 GMT 0
     * Dec 31, 2019 @ 00:00 GMT 0
     * Apr 20, 2020 @ 00:00 GMT 0
     */
    vestingTimes = [1538734600, 1538734660, 1538734760, 1538734860];
    vestingPercents = [20, 20, 30, 30];

  }

  function calculateVestingPortions() public onlyOwner {
    require(vestingTimes.length == vestingPercents.length, "vestingTimes.length should be == vestingPercents.length");

    uint256 totalBalance = token.balanceOf(address(this));
    require(totalBalance > 0, "contaract does not own tokens");

    require(minimumContractBalance[vestingTimes[0]] == 0, "already calculated");
    
    uint256 percentSum;
    for (uint256 i = 0; i < vestingPercents.length; i ++) {
      percentSum = percentSum.add(vestingPercents[i]);

      minimumContractBalance[vestingTimes[i]] = totalBalance.sub(totalBalance.mul(percentSum).div(100));
    }
  }

  function transferTokens(address _to, uint256 _amount) public onlyOwner {
    require(_to != address(0), "reciever can not be 0");
    require(_amount > 0, "token amount must be > 0");

    uint256 currentBalance = uint256 (ERC20Basic(token).balanceOf(address(this)));
    uint256 minimumBalance = currentBalance;
    for (uint256 i = 0; i < vestingTimes.length; i ++) {
      if (now >= vestingTimes[i]) {
        minimumBalance = minimumContractBalance[vestingTimes[i]];
      } else {
        break;
      }
    }

    require(currentBalance.sub(_amount) >= minimumBalance, "token amount to transfer exceeds limit for vesting period");

    token.safeTransfer(_to, _amount);
  }

  function updatedVestingTimes(uint256[] _times) public onlyOwner {
    require(_times.length == vestingTimes.length, "amount is not equal to existed");

    for (uint256 i = 0; i < _times.length; i ++) {
      require(_times[i] > 0, "each vesting time should be > 0");

      uint256 amount = minimumContractBalance[vestingTimes[i]];
      minimumContractBalance[vestingTimes[i]] = 0;
      minimumContractBalance[_times[i]] = amount;
    }

    vestingTimes = _times;
  }

}
