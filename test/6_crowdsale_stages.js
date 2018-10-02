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

    let timings;
    let wallet = accounts[9];

    beforeEach("create crowdsale inst", async () => {
        await advanceBlock();

        const OPENING = latestTime() + duration.hours(1);
        const ICO_START = OPENING + duration.hours(1);
        const CLOSING = ICO_START + duration.hours(1);
        timings = [OPENING, ICO_START, CLOSING];

        icoStart = ICO_START;

        let mock = crowdsaleMock();

        token = await MRC_Token.new();
        crowdsale = await MRC_Crowdsale.new(mock.rateETH, token.address, wallet, timings);
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
            //  baseTokens = 500 * 2ETH = 1000 0000 0000
            //  bonus for ICO = base * 20 / 100 = 200 0000 0000
            const TOKENS = new BigNumber(120000000000);

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
            //  baseTokens = 500 * 2ETH = 1000 0000 0000
            //  bonus for ICO = base * 20 / 100 = 200 0000 0000
            const TOKENS_ICO = new BigNumber(120000000000);

            assert.equal(new BigNumber(await token.balanceOf(ACC_1)).toNumber(), TOKENS_PRE_ICO.plus(TOKENS_ICO).toNumber(), "wrong tokens after preICO and ICO purchases");
        });
    });

    describe("icoStageHasStarted", () => {
        it("should vlidate icoStageHasStarted", async () => {
            assert.isFalse(await crowdsale.icoStageHasStarted.call(), "ICO should not be started yet");

            await increaseTimeTo(await crowdsale.icoStageStartTimestamp.call());
            assert.isTrue(await crowdsale.icoStageHasStarted.call(), "ICO should be started now");
        });
    });

    describe("rateETH", () => {
        it("should allow owner to update preICO rate", async () => {
            await crowdsale.updateExchangeRate_preICO(200);
            assert.isFalse(await crowdsale.icoStageHasStarted.call(), "preICO should be running still");
            assert.equal(new BigNumber(await crowdsale.currentRateETH.call()).toNumber(), 200, "wrong preICO rate after update");
        });

        it("should allow owner to update ICO rate", async () => {
            await crowdsale.updateExchangeRate_ICO(300);
            await increaseTimeTo(await timings[1] + 1);
            assert.isTrue(await crowdsale.icoStageHasStarted.call(), "ICO should be started now");
            assert.equal(new BigNumber(await crowdsale.currentRateETH.call()).toNumber(), 300, "wrong ICO rate after update");
        });

        it("should not allow not owner to update preICO rate", async () => {
            await expectThrow(crowdsale.updateExchangeRate_preICO(200, {
                from: ACC_1
            }), "should not allow not owner to update exchange rate");
        });

        it("should not allow not owner to update ICO rate", async () => {
            await expectThrow(crowdsale.updateExchangeRate_ICO(200, {
                from: ACC_1
            }), "should not allow not owner to update exchange rate");
        });

        it("should validate correct rate for preICO", async () => {
            assert.equal(new BigNumber(await crowdsale.currentRateETH.call()).toNumber(), crowdsaleMock().rateETH[0], "wrong rate for preICO")
        });

        it("should validate correct rate for ICO", async () => {
            await increaseTimeTo(await timings[1] + 1);
            assert.equal(new BigNumber(await crowdsale.currentRateETH.call()).toNumber(), crowdsaleMock().rateETH[1], "wrong rate for ICO")
        });
    });

    describe("fund transfer on purchase", () => {
        it("should validate funds not moved to wallet before soft cap reach", async () => {
            let balanceBefore = new BigNumber(await web3.eth.getBalance(wallet));
            await crowdsale.sendTransaction({
                from: ACC_1,
                value: ether(2)
            });
            assert.equal(new BigNumber(await web3.eth.getBalance(wallet)).toNumber(), balanceBefore.toNumber(), "funds should stay in contract before soft cap reached");
        });

        it("should validate funds transferred to wallet after soft cap exactly reached", async () => {
            let balanceBefore = new BigNumber(await web3.eth.getBalance(wallet));
            let softCap = new BigNumber(await crowdsale.goal.call());
            await crowdsale.sendTransaction({
                from: ACC_1,
                value: softCap.toNumber()
            });
            let balanceAfter = new BigNumber(await web3.eth.getBalance(wallet));
            assert.equal(balanceAfter.minus(balanceBefore).toNumber(), softCap.toNumber(), "funds should stay in contract before soft cap reached");
        });

        it("should move fund to wallet after soft cap reached after multiple purchases", async () => {
            await crowdsale.addToWhitelist(ACC_2, ACC_2);
            let balanceBefore = new BigNumber(await web3.eth.getBalance(wallet));
            console.log("balanceBefore: ", balanceBefore.toNumber());

            //  1
            await crowdsale.sendTransaction({
                from: ACC_2,
                value: ether(2)
            });

            // 2
            let softCap = new BigNumber(await crowdsale.goal.call());
            await crowdsale.sendTransaction({
                from: ACC_1,
                value: softCap.toNumber()
            });
            let balanceAfter = new BigNumber(await web3.eth.getBalance(wallet));
            console.log("balanceAfter: ", balanceAfter.toNumber());
            assert.equal(balanceAfter.minus(balanceBefore).toNumber(), softCap.plus(ether(2)).toNumber(), "wrong wallet balance after soft cap reached");

        });
    })
});