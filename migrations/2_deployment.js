let MRC_Token = artifacts.require("./MRC_Token.sol");
let MRC_Crowdsale = artifacts.require("./MRC_Crowdsale.sol");

let IncreaseTime = require("../test/helpers/increaseTime.js");

module.exports = async function (deployer, network, accounts) {
    const WALLET = accounts[9];
    const RATE_ETH = [1500, 500]; //  tokens per ETH

    await deployer.deploy(MRC_Token).then(async () => {
        let token = await MRC_Token.deployed();

        const OPENING = web3.eth.getBlock("latest").timestamp + IncreaseTime.duration.hours(1); //  TODO: set before deploy
        const ICO_START = OPENING + IncreaseTime.duration.hours(1); //  TODO: set before deploy
        const CLOSING = ICO_START + IncreaseTime.duration.hours(1); //  TODO: set before deploy
        const TIMINGS = [OPENING, ICO_START, CLOSING];

        let crowdsale = await deployer.deploy(MRC_Crowdsale, RATE_ETH, token.address, WALLET, TIMINGS);
        await token.transferOwnership(crowdsale.address);
    });
}