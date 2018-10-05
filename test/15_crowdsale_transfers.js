const MRC_Token = artifacts.require("MRC_Token");
const MRC_Crowdsale = artifacts.require("./MRC_Crowdsale.sol");
const BigNumber = require("bignumber.js");

import {
    advanceBlock
} from './helpers/advanceToBlock.js';

import increaseTime, {
    duration,
    increaseTimeTo
} from "./helpers/increaseTime.js";
import expectThrow from './helpers/expectThrow.js';
import crowdsaleMock from "./helpers/mocks/crowdsaleMock.js";

contract("Manual transfer", (accounts) => {
    const OWNER = accounts[0];
    const ACC_1 = accounts[1];
    const ACC_2 = accounts[2];

    let token;
    let crowdsale;

    beforeEach("create crowdsale inst", async () => {
        await advanceBlock();

        token = await MRC_Token.new();

        let mock = crowdsaleMock();
        let wallet = accounts[9];

        const OPENING = web3.eth.getBlock("latest").timestamp + duration.hours(1);
        const ICO_START = OPENING + duration.hours(1);
        const CLOSING = ICO_START + duration.hours(1);
        const TIMINGS = [OPENING, ICO_START, CLOSING];

        crowdsale = await MRC_Crowdsale.new(mock.rateETH, token.address, wallet, TIMINGS);
        await token.transferOwnership(crowdsale.address);
    });

    describe("transfer manually", () => {
        it("should validate correct token amount is being minted", async () => {
            const TOKENS = 10 * (10 ** 8);
            await crowdsale.manualMint(ACC_1, TOKENS);

            assert.equal(new BigNumber(await token.balanceOf(ACC_1)).toNumber(), TOKENS, "wrong token amount after manual minting");
        });

        it("should validate correct token amount for address after multiple manual mintings", async () => {
            const TOKENS_1 = 10 * (10 ** 8);
            const TOKENS_2 = 4 * (10 ** 8);
            await crowdsale.manualMint(ACC_1, TOKENS_1);
            await crowdsale.manualMint(ACC_1, TOKENS_2);

            assert.equal(new BigNumber(await token.balanceOf(ACC_1)).toNumber(), TOKENS_1 + TOKENS_2, "wrong token amount after combined manual mintings");
        });

        it("should validate not owner can not manually mint", async () => {
            const TOKENS = 10 * (10 ** 8);
            await expectThrow(crowdsale.manualMint(ACC_1, TOKENS, {
                from: ACC_1
            }), "should fail, because not owner can not manually mint");
        });

        it("should validate manually minted tokens are being added to minted tokens", async () => {
            let tokens = 150000000;
            let totalSupplyBefore = new BigNumber(await token.totalSupply.call());
            await crowdsale.manualMint(ACC_1, tokens);
            let totalSupplyAfter = new BigNumber(await token.totalSupply.call());
            assert.equal(totalSupplyAfter.minus(totalSupplyBefore).toNumber(), 150000000, "wrong totalSupply after manual minting");
        });
    });
});