pragma solidity ^0.4.24;

import "../node_modules/openzeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "./MRC_RefundableCrowdsale.sol";

import "./MRC_Token.sol";

/**
  * timing
  * minWei
  * stages
 */

contract MRC_StagesCrowdsale is MRC_RefundableCrowdsale {
  uint256 public investmentMinPreICO = 1.5 * (10 ** 18);
  uint256 public investmentMaxPreICO = 35 * (10 ** 18);
  uint256 public investmentMinICO = 0.5 * (10 ** 18);
  uint256 public investmentMaxICO = 20 * (10 ** 18);

  uint256 public discountPercentPreICO = 40;
  uint256 public discountPercentICO = 20;

  uint256 public icoStageStartTimestamp;

  uint256[] public rateETH; //  0 - preICO; 1 - ICO

  /**
   * @dev Constructor, takes crowdsale opening and closing times.
   * @param _rateETH  Crowdsale token per ETH rate, [preICO, ICO]
   * @param _wallet   Crowdsale wallet
   * @param _token    Crowdsale token
   * @param _timings  Crowdsale timings: [OPENING, ICO_START, CLOSING]
   */
  constructor(uint256[] _rateETH, address _wallet, ERC20 _token, uint256[] _timings, uint256 _softCap) 
    Crowdsale(1, _wallet, _token)
    TimedCrowdsale(_timings[0], _timings[2])
    MRC_RefundableCrowdsale(_softCap) public {

      icoStageStartTimestamp = _timings[1];
      validateAndSaveRateETH(_rateETH);
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
   * @dev Checks whether ICO stage has already started.
   * @return Whether ICO stage has already started
   */
  function icoStageHasStarted() public view returns(bool) {
    return now >= icoStageStartTimestamp;
  }

  /**
   * @dev Determines rate for current stage.
   * @return Rate for current stage
   */
  function currentRateETH() public view returns (uint256) {
    return icoStageHasStarted() ? rateETH[1] : rateETH[0];
  }

  /**
   * @dev Update preICO rate. Use it to update rate for ICO stage.
   * @param _rate Rate to be updated to
   */
  function updateExchangeRate_preICO(uint256 _rate) public onlyOwner {
    require(_rate > 0, "rate should be > 0");
    rateETH[0] = _rate;
  }

  /**
   * @dev Update ICO rate. Use it to update rate for ICO stage.
   * @param _rate Rate to be updated to
   */
  function updateExchangeRate_ICO(uint256 _rate) public onlyOwner {
    require(_rate > 0, "rate should be > 0");
    rateETH[1] = _rate;
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
   * @dev Validates rateETH and save it if successful.
   */
  function validateAndSaveRateETH(uint256[] _rateETH) private {
    require(_rateETH.length == 2, "wrong rateETH length");

    for(uint256 i = 0; i < _rateETH.length; i ++) {
      require(_rateETH[i] > 0, "rate should be > 0");
    }

    rateETH = _rateETH;
  }
}
