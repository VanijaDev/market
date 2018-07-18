let MRC_Token = artifacts.require("./MRC_Token.sol");
let MRC_Crowdsale = artifacts.require("./MRC_Crowdsale.sol");

let IncreaseTime = require("../test/helpers/increaseTime.js");

module.exports = async function (deployer, network, accounts) {
    const WALLET = accounts[9];
    const RATE = 1500; //  tokens per ETH

    await deployer.deploy(MRC_Token).then(async () => {
        let token = await MRC_Token.deployed();

        const OPENING = web3.eth.getBlock("latest").timestamp + IncreaseTime.duration.hours(1);
        const ICO_START = OPENING + IncreaseTime.duration.hours(1);
        const CLOSING = ICO_START + IncreaseTime.duration.hours(1);
        const TIMINGS = [OPENING, ICO_START, CLOSING];

        const RESERVE_TEAM = 14;
        const RESERVE_BOUNTY = 5;
        const RESERVE_DEVELOPMENT = 15;
        const RESERVE_SALE_COST = 1;
        const RESERVATIONS = [RESERVE_TEAM, RESERVE_BOUNTY, RESERVE_DEVELOPMENT, RESERVE_SALE_COST];

        let crowdsale = await deployer.deploy(MRC_Crowdsale, RATE, WALLET, token.address, RESERVATIONS, TIMINGS);
        await token.transferOwnership(crowdsale.address);
    });
}