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
        crowdsale = await MRC_Crowdsale.new(mock.rate, token.address, wallet, mock.reservations, TIMINGS);
        await token.transferOwnership(crowdsale.address);

        await crowdsale.addToWhitelist(ACC_1, ACC_1);
        await increaseTimeTo(OPENING + duration.minutes(1));
    });

    describe("ICO start time", () => {
        it("should validate ICO start time is correct", async () => {
            assert.equal(new BigNumber(await crowdsale.icoStageStartTimestamp.call()).toNumber(), icoStart, "wrong icoStageStartTimestamp after deployment");
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

        it("should can purchase in purchase range", async () => {
            await crowdsale.sendTransaction({
                from: ACC_1,
                value: ether(2)
            });
        });

        it("should can not purchase above limit", async () => {
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
});