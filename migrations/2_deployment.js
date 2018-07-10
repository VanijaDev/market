let MRC_Token = artifacts.require("./MRC_Token.sol");
let MRC_Crowdsale = artifacts.require("./MRC_Crowdsale.sol");


module.exports = async function (deployer, network, accounts) {
    const WALLET = accounts[9];

    await deployer.deploy(MRC_Token);
    let token = await IMP_Token.deployed();

    await deployer.deploy(MRC_Crowdsale, 1500, WALLET, token.address, [14, 5, 15, 1]);
}