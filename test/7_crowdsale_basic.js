//  funds not transferred to wallet if < softCap
//  funds transferred to wallet if >= softCap

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

contract("Basic", (accounts) => {
    const OWNER = accounts[0];
    const ACC_1 = accounts[1];
    const ACC_2 = accounts[2];

    let token;
    let crowdsale;
    let wallet = accounts[9];

    beforeEach("create crowdsale inst", async () => {
        await advanceBlock();

        const OPENING = latestTime() + duration.hours(1);
        const ICO_START = OPENING + duration.hours(1);
        const CLOSING = ICO_START + duration.hours(1);
        const TIMINGS = [OPENING, ICO_START, CLOSING];

        let mock = crowdsaleMock();

        token = await MRC_Token.new();
        crowdsale = await MRC_Crowdsale.new(mock.rate, token.address, wallet, mock.reservations, TIMINGS);
        await token.transferOwnership(crowdsale.address);

        await crowdsale.addToWhitelist(ACC_1, ACC_1);
        await increaseTimeTo(OPENING + duration.minutes(1));
    });

    describe("funds forwarding", () => {
        it("should not transfer funds < softCap", async () => {
            let softCap = new BigNumber(await crowdsale.softCap.call());
            let softCapHalf = softCap.dividedBy(2);

            await crowdsale.sendTransaction({
                from: ACC_1,
                value: softCapHalf.toNumber()
            });
            assert.equal(await new BigNumber(await web3.eth.getBalance(crowdsale.address)).toNumber(), softCapHalf.toNumber(), "wrong crowdsale contract balance after softCapHalf transferred");
        });

        it("should transfer funds to wallet if >= softCap", async () => {
            let softCap = new BigNumber(await crowdsale.softCap.call());
            let softCapHalf = softCap.dividedBy(2);
            let walletPrevBalance = await web3.eth.getBalance(wallet);
            console.log(new BigNumber(await web3.eth.getBalance(wallet)).toNumber());

            await crowdsale.sendTransaction({
                from: ACC_1,
                value: softCapHalf.toNumber()
            });

            console.log(new BigNumber(await web3.eth.getBalance(wallet)).toNumber());

            await crowdsale.sendTransaction({
                from: ACC_1,
                value: softCapHalf.toNumber()
            });

            console.log(new BigNumber(await web3.eth.getBalance(wallet)).toNumber());

            assert.equal(await new BigNumber(await web3.eth.getBalance(crowdsale.address)).toNumber(), 0, "wrong crowdsale contract balance after > softCap transferred");

            let walletCurBalance = await web3.eth.getBalance(wallet);
            assert.equal(walletCurBalance.minus(walletPrevBalance).toNumber(), softCap.toNumber(), "wrong wallet balance after > softCap transferred");
        });
    });
});