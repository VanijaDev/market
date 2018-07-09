let MRC_Token = artifacts.require("./MRC_Token.sol");
let MRC_Crowdsale = artifacts.require("./MRC_Crowdsale.sol");

//  tODO: () =>
module.exports = function (deployer) {
    deployer.deploy(MRC_Token);
}