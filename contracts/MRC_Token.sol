pragma solidity ^0.4.24;

import "../node_modules/openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol";
import "../node_modules/openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";


contract MRC_Token is DetailedERC20("Market TEST", "MRKT", 8), MintableToken {
  uint256 public totalSupplyMax;

  modifier amountAllowedToMint(uint256 _amount) {
    require(totalSupply().add(_amount) <= totalSupplyMax, "token amount cannot be minted because totalSupply will exceed totalSupplyMax");
    _;
  }
  
  constructor() public {
    totalSupplyMax = 1 * 10 ^ 9; //   1 000 000 000
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
    amountAllowedToMint(_amount)
    public
    returns (bool)
  {
    super.mint(_to, _amount);
  }
}
