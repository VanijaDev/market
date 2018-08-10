pragma solidity ^0.4.22;

import "../node_modules/openzeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "../node_modules/openzeppelin-solidity/contracts/crowdsale/validation/TimedCrowdsale.sol";

import "./MRC_Token.sol";

/**
  * timing
  * minWei
  * stages
 */

contract MRC_StagesCrowdsale is TimedCrowdsale {
  uint256 public investmentMinPreICO = 1.5 * (10 ** 18);
  uint256 public investmentMaxPreICO = 35 * (10 ** 18);
  uint256 public investmentMinICO = 0.5 * (10 ** 18);
  uint256 public investmentMaxICO = 20 * (10 ** 18);

  uint256 public discountPercentPreICO = 40;
  uint256 public discountPercentICO = 20;

  uint256 public icoStageStartTimestamp;

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

      icoStageStartTimestamp = _timings[1];
  }

  /**
   * @dev Checks whether the period in which the crowdsale is open has already started.
   * @return Whether crowdsale period has started
   */
  function hasOpened() public view returns (bool) {
    // solium-disable-next-line security/no-block-members
    return block.timestamp > openingTime;
  }

  /**
   * @dev Checks whether wei amount is valid for current stage investment limits.
   * @return Whether wei amount is valid for current stage investment limits
   */
  function withinInvestmentlimits(uint256 _wei) internal view returns(bool) {
    if (icoStageHasStarted()) {
      return _wei >= investmentMinICO && _wei <= investmentMaxICO;
    }

    return _wei >= investmentMinPreICO && _wei <= investmentMaxPreICO;
  }


  /**
   * INTERNAL
   */

  /**
   * @dev Checks current discount percent based on crowdsale stage.
   * @return discount percent
   */
  function currentDiscountPercent() public view returns(uint256) {
    return icoStageHasStarted() ? discountPercentICO : discountPercentPreICO;
  }

  /**
   * PRIVATE
   */

  /**
   * @dev Checks whether ICO stage has already started.
   * @return Whether ICO stage has already started
   */
  function icoStageHasStarted() private view returns(bool) {
    return now >= icoStageStartTimestamp;
  }
}


// TODO: implement finishMinting()
