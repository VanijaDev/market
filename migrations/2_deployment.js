let MRC_Token = artifacts.require("./MRC_Token.sol");
let MRC_Crowdsale = artifacts.require("./MRC_Crowdsale.sol");


module.exports = async function (deployer, network, accounts) {
    const WALLET = accounts[9];
    const RATE = 1500; //  tokens per ETH

    await deployer.deploy(MRC_Token);
    let token = await MRC_Token.deployed();

    const RESERVE_TEAM = 14;
    const RESERVE_BOUNTY = 5;
    const RESERVE_DEVELOPMENT = 15;
    const RESERVE_SALE_COST = 1;

    await deployer.deploy(MRC_Crowdsale, RATE, WALLET, token.address, [RESERVE_TEAM, RESERVE_BOUNTY, RESERVE_DEVELOPMENT, RESERVE_SALE_COST]);
}