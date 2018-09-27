pragma solidity ^0.4.24;

import "../node_modules/openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol";
import "../node_modules/openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";


contract MRC_Token is DetailedERC20("Mercato", "MRC", 8), MintableToken {
  uint256 public totalSupplyMax;


  /**
   * @dev Throws if increased amount of tokens exceeds max available amount.
   * @param _amount token amount to be increased with
   */
  modifier amountWithinMaxLimit(uint256 _amount) {
    require(totalSupply().add(_amount) <= totalSupplyMax, "token amount cannot be minted because totalSupply will exceed totalSupplyMax");
    _;
  }
  
  constructor() public {
    totalSupplyMax = 1e17; //   1 000 000 000 0000 0000
  }

  /**
   * @dev Function to mint tokens
   * @param _to The address that will receive the minted tokens.
   * @param _amount The amount of tokens to mint.
   * @return A boolean that indicates if the operation was successful.
   */
  function mint(
    address _to,
    uint256 _amount
  )
    hasMintPermission
    canMint
    amountWithinMaxLimit(_amount)
    public
    returns (bool)
  {
    return super.mint(_to, _amount);
  }
}
