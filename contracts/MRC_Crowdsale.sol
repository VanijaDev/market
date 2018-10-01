pragma solidity ^0.4.24;

import "../node_modules/openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "../node_modules/openzeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol";
import "../node_modules/openzeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol";

import "./MRC_WhitelistedSourceDestination.sol";
import "./MRC_CrowdsaleReservations.sol";
import "./MRC_StagesCrowdsale.sol";
import "./MRC_Token.sol";


contract MRC_Crowdsale is MintedCrowdsale, CappedCrowdsale, MRC_StagesCrowdsale, Pausable, MRC_WhitelistedSourceDestination, MRC_CrowdsaleReservations {
  uint256 private softCap = 3*(10**18);  //  TODO: correct values before deploy
  uint256 private hardCap = 7*(10**18);  //  TODO: correct values before deploy


  /**
   * @dev Constructor, takes crowdsale opening and closing times.
   * @param _rateETH              Crowdsale token per ETH rate, [preICO, ICO]
   * @param _wallet               Crowdsale wallet
   * @param _token                Crowdsale token
   * @param _timings              Crowdsale timings: [OPENING, ICO_START, CLOSING]
   */
  constructor(uint256[] _rateETH, ERC20 _token, address _wallet, uint256[] _timings)
  CappedCrowdsale(hardCap)
  MRC_StagesCrowdsale(_rateETH, _wallet, _token, _timings, softCap)
  MRC_CrowdsaleReservations(_token)
  public {
  }

  /**
   * PUBLIC
   */

  /**
   * @dev Owner can manually mint tokens to addresses.
   * @param _to Token beneficiary
   * @param _amount Token amount to be minted
   */
  function manualMint(address _to, uint256 _amount) public onlyOwner {
    _deliverTokens(_to, _amount);
  }

  function transferUnspentTokens(address _to) public onlyOwner {
    require(isFinalized);
    
    uint256 unspentTokens = MRC_Token(token).totalSupplyMax().sub(token.totalSupply());
    _deliverTokens(_to, unspentTokens);
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
    onlyIfWhitelisted(_beneficiary)
    whenNotPaused

  {
    require(withinInvestmentlimits(_weiAmount), "wei is not within purchase limit range");
    super._preValidatePurchase(_beneficiary, _weiAmount);
  }

  /**
   * @dev Override to extend the way in which ether is converted to tokens.
   * @param _weiAmount Value in wei to be converted into tokens
   * @return Number of tokens that can be purchased with the specified _weiAmount
   */
  function _getTokenAmount(uint256 _weiAmount)
    internal view returns (uint256)
  {
    uint256 rateETH = currentRateETH();
    uint256 baseTokens = _weiAmount.mul(rateETH).div(10 ** 10);  //  rate is used for ETH not wei

    uint256 discountPercent = currentDiscountPercent();
    uint256 bonusTokens = baseTokens.mul(discountPercent).div(100);

    return baseTokens.add(bonusTokens);
  }

  /**
   * @dev Source of tokens. Override this method to modify the way in which the crowdsale ultimately gets and sends its tokens.
   * @param _beneficiary Address performing the token purchase
   * @param _tokenAmount Number of tokens to be emitted
   */
   // TEST max mint amount
  function _deliverTokens(
    address _beneficiary,
    uint256 _tokenAmount
  )
    internal
    nonZeroAddressOnly(_beneficiary)
  {
    require(_tokenAmount > 0, "token amount to deliver must be > 0");
    super._deliverTokens(_beneficiary, _tokenAmount);
  }


  /**
   * PRIVATE
   */
}
