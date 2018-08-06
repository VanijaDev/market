pragma solidity ^0.4.24;

import "../node_modules/openzeppelin-solidity/contracts/ownership/Ownable.sol";


contract MRC_WhitelistedSourceDestination is Ownable {

  mapping (address => address) public whitelist;

  /**
   * @dev Reverts if beneficiary is not whitelisted. Can be used when extending this contract.
   */
   // TODO: test
  modifier isWhitelisted(address _source) {
    require(whitelist[_source] != address(0), "source address has no destination address");
    _;
  }

  /**
   * @dev Adds single address to whitelist.
   * @param _source Address to be added to the whitelist as source
   * @param _destination Address to be added to the whitelist as token destination address
   */
  function addToWhitelist(address _source, address _destination) external onlyOwner {
    require(_source != address(0), "source address cannot be set to 0");  // TODO: test
    require(_destination != address(0), "destination address cannot be set to 0");  // TODO: test

    whitelist[_source] = _destination;
  }

  /**
   * @dev Adds list of addresses to whitelist. Not overloaded due to limitations with truffle testing.
   * @param _sources Addresses to be added to the whitelist as sources
   * @param _destinations Addressees to be added to the whitelist as token destination addresses
   */
  function addManyToWhitelist(address[] _sources, address[] _destinations) external onlyOwner {
    require(_sources.length == _destinations.length, "sources and destinations arrays length are not equal");  // TODO: test

    for (uint256 i = 0; i < _sources.length; i++) {
      require(_sources[i] != address(0), "sources[i] address cannot be set to 0");  // TODO: test
      require(_destinations[i] != address(0), "destination[i] address cannot be set to 0");  // TODO: test

      whitelist[_sources[i]] = _destinations[i];
    }
  }

  /**
   * @dev Removes single address from whitelist.
   * @param _source Address to be removed to the whitelist
   */
  function removeFromWhitelist(address _source) external onlyOwner {
    whitelist[_source] = address(0);
  }

}
