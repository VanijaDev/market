const MRC_Token = artifacts.require("MRC_Token");
const MRC_Crowdsale = artifacts.require("./MRC_Crowdsale.sol");
const BigNumber = require("bignumber.js");

import {
    advanceBlock
} from './helpers/advanceToBlock.js';

import increaseTime, {
    duration,
    increaseTimeTo
} from "./helpers/increaseTime";
import expectThrow from './helpers/expectThrow';
import crowdsaleMock from "./helpers/mocks/crowdsaleMock";
import latestTime from "./helpers/latestTime.js";
import ether from "./helpers/ether";

contract("Stages", (accounts) => {
    const OWNER = accounts[0];
    const ACC_1 = accounts[1];
    const ACC_2 = accounts[2];

    let token;
    let crowdsale;
    let icoStart;

    beforeEach("create crowdsale inst", async () => {
        await advanceBlock();

        const OPENING = latestTime() + duration.hours(1);
        const ICO_START = OPENING + duration.hours(1);
        const CLOSING = ICO_START + duration.hours(1);
        const TIMINGS = [OPENING, ICO_START, CLOSING];

        icoStart = ICO_START;

        let mock = crowdsaleMock();
        let wallet = accounts[9];

        token = await MRC_Token.new();
        crowdsale = await MRC_Crowdsale.new(mock.rate, token.address, wallet, TIMINGS);
        await token.transferOwnership(crowdsale.address);

        await crowdsale.addToWhitelist(ACC_1, ACC_1);
        await increaseTimeTo(OPENING + duration.minutes(1));
    });

    describe("ICO start time", () => {
        it("should validate ICO start time is correct", async () => {
            assert.equal(new BigNumber(await crowdsale.icoStageStartTimestamp.call()).toNumber(), icoStart, "wrong icoStageStartTimestamp after deployment");
        });
    });

    describe("currentDiscountPercent for stages", () => {
        it("should validate discount percent for preICO", async () => {
            assert.equal(new BigNumber(await crowdsale.currentDiscountPercent.call()).toNumber(), new BigNumber(await crowdsale.discountPercentPreICO.call()).toNumber(), "wrong discount percent for preICO");
        });

        it("should validate discount percent for ICO", async () => {
            await increaseTimeTo(await crowdsale.icoStageStartTimestamp.call());
            assert.equal(new BigNumber(await crowdsale.currentDiscountPercent.call()).toNumber(), new BigNumber(await crowdsale.discountPercentICO.call()).toNumber(), "wrong discount percent for ICO");
        });
    });

    describe("preICO purchase limit ranges", () => {
        it("preICO should validate limits are correct", async () => {
            assert.equal(new BigNumber(await crowdsale.investmentMinPreICO.call()).toNumber(), ether(1.5), "wrong investmentMinPreICO");
            assert.equal(new BigNumber(await crowdsale.investmentMaxPreICO.call()).toNumber(), ether(35), "wrong investmentMaxPreICO");
        });

        it("should not purchase below limit", async () => {
            await expectThrow(crowdsale.sendTransaction({
                from: ACC_1,
                value: ether(1)
            }), "should throw because wei < preICO limit");
        });

        it("should purchase in purchase range", async () => {
            await crowdsale.sendTransaction({
                from: ACC_1,
                value: ether(2)
            });
        });

        it("should not purchase above limit", async () => {
            await expectThrow(crowdsale.sendTransaction({
                from: ACC_1,
                value: ether(35.5)
            }), "should throw because wei > preICO limit");
        });
    });

    describe("ICO purchase limit ranges", () => {
        it("should validate limits are correct", async () => {
            assert.equal(new BigNumber(await crowdsale.investmentMinICO.call()).toNumber(), ether(0.5), "wrong investmentMinICO");
            assert.equal(new BigNumber(await crowdsale.investmentMaxICO.call()).toNumber(), ether(20), "wrong investmentMaxICO");
        });

        it("should not purchase below limit", async () => {
            await increaseTimeTo(await crowdsale.icoStageStartTimestamp.call());

            await expectThrow(crowdsale.sendTransaction({
                from: ACC_1,
                value: ether(0.4)
            }), "should throw because wei < ICO limit");
        });

        it("should purchase in purchase range", async () => {
            await increaseTimeTo(await crowdsale.icoStageStartTimestamp.call());

            await crowdsale.sendTransaction({
                from: ACC_1,
                value: ether(2)
            });
        });

        it("should not purchase above limit", async () => {
            await increaseTimeTo(await crowdsale.icoStageStartTimestamp.call());

            await expectThrow(crowdsale.sendTransaction({
                from: ACC_1,
                value: ether(20.5)
            }), "should throw because wei > ICO limit");
        });
    });

    describe("token calculations", () => {
        it("should correctly calculate and summarise bonus tokens for preICO", async () => {
            await crowdsale.sendTransaction({
                from: ACC_1,
                value: ether(2)
            });
            //  baseTokens = 1500 * 1ETH = 3000 0000 0000
            //  bonus for preICO = base * 40 / 100 = 1200 0000 0000
            const TOKENS = new BigNumber(420000000000);

            assert.equal(new BigNumber(await token.balanceOf(ACC_1)).toNumber(), TOKENS.toNumber(), "wrong tokens after preICO purchase");
        });

        it("should correctly calculate and summarise bonus tokens for ICO", async () => {
            await increaseTimeTo(await crowdsale.icoStageStartTimestamp.call());

            await crowdsale.sendTransaction({
                from: ACC_1,
                value: ether(2)
            });
            //  baseTokens = 1500 * 2ETH = 3000 0000 0000
            //  bonus for ICO = base * 20 / 100 = 600 0000 0000
            const TOKENS = new BigNumber(360000000000);

            assert.equal(new BigNumber(await token.balanceOf(ACC_1)).toNumber(), TOKENS.toNumber(), "wrong tokens after ICO purchase");
        });

        it("should correctly calculate and summarise bonus tokens for both preICO and ICO purchases", async () => {
            await crowdsale.sendTransaction({
                from: ACC_1,
                value: ether(2)
            });
            //  baseTokens = 1500 * 1ETH = 3000 0000 0000
            //  bonus for preICO = base * 40 / 100 = 1200 0000 0000
            const TOKENS_PRE_ICO = new BigNumber(420000000000);


            await increaseTimeTo(await crowdsale.icoStageStartTimestamp.call());
            await crowdsale.sendTransaction({
                from: ACC_1,
                value: ether(2)
            });
            //  baseTokens = 1500 * 2ETH = 3000 0000 0000
            //  bonus for ICO = base * 20 / 100 = 600 0000 0000
            const TOKENS_ICO = new BigNumber(360000000000);

            assert.equal(new BigNumber(await token.balanceOf(ACC_1)).toNumber(), TOKENS_PRE_ICO.plus(TOKENS_ICO).toNumber(), "wrong tokens after preICO and ICO purchases");
        });
    });

    describe.only("icoStageHasStarted", () => {
        it("should vlidate icoStageHasStarted", async () => {
            assert.isFalse(await crowdsale.icoStageHasStarted.call(), "ICO should not be started yet");

            await increaseTimeTo(await crowdsale.icoStageStartTimestamp.call());
            assert.isTrue(await crowdsale.icoStageHasStarted.call(), "ICO should be started now");
        });
    });
});