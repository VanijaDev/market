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
import ether from "./helpers/ether.js";

contract("Refundable", (accounts) => {
  const OWNER = accounts[0];
  const ACC_1 = accounts[1];
  const ACC_2 = accounts[2];

  let token;
  let crowdsale;
  let timings;

  beforeEach("create crowdsale inst", async () => {
    await advanceBlock();

    token = await MRC_Token.new();

    let mock = crowdsaleMock();
    let wallet = accounts[9];

    const OPENING = web3.eth.getBlock("latest").timestamp + duration.hours(1);
    const ICO_START = OPENING + duration.hours(1);
    const CLOSING = ICO_START + duration.hours(1);
    timings = [OPENING, ICO_START, CLOSING];

    crowdsale = await MRC_Crowdsale.new(mock.rateETH, token.address, wallet, timings);
    await token.transferOwnership(crowdsale.address);
    await crowdsale.addManyToWhitelist([ACC_1, ACC_2], [ACC_1, ACC_2]);
    await increaseTimeTo(OPENING + duration.minutes(1));
  });

  describe("goalReached", () => {
    it("should validate goal was not reached", async () => {
      let softCap = new BigNumber(await crowdsale.goal.call());
      let softCapHalf = softCap.dividedBy(2);

      await crowdsale.sendTransaction({
        from: ACC_1,
        value: softCapHalf.toNumber()
      });

      assert.isFalse(await crowdsale.goalReached.call(), "goal should not be reached yet");
    });

    it("should validate goal was reached", async () => {
      let softCap = new BigNumber(await crowdsale.goal.call());

      await crowdsale.sendTransaction({
        from: ACC_1,
        value: softCap.toNumber()
      });

      assert.isTrue(await crowdsale.goalReached.call(), "goal should be already reached");
    });
  });

  describe("finalize", () => {
    it("should not finalize before close time", async () => {
      await expectThrow(crowdsale.finalize(), "should not finalize be finalized before close time");

      await increaseTimeTo(timings[0] + duration.minutes(1));
      await expectThrow(crowdsale.finalize(), "should not finalize be finalized before close time");

      await increaseTimeTo(timings[1] + duration.minutes(1));
      await expectThrow(crowdsale.finalize(), "should not finalize be finalized before close time");
    });

    it("should validate cannot be finalized after closed by not owner", async () => {
      await increaseTimeTo(timings[2] + duration.minutes(1));
      await expectThrow(crowdsale.finalize({
        from: ACC_1
      }), "not owner should not finalize");
    });

    it("should finalize after closed by owner", async () => {
      await increaseTimeTo(timings[2] + duration.minutes(1));
      await crowdsale.finalize();
    });

    it("should not finalize second time", async () => {
      await increaseTimeTo(timings[2] + duration.minutes(1));
      await crowdsale.finalize();

      await expectThrow(crowdsale.finalize());
    });

    it("should emit Finalize event", async () => {
      await increaseTimeTo(timings[2] + duration.minutes(1));
      let tx = await crowdsale.finalize();
      assert.equal(tx.logs.length, 1, "should be 1 event");
      assert.equal(tx.logs[0].event, "Finalized", "wrong event name on finalize()");
    });

    it("should finish token minting after finalize", async () => {
      assert.isFalse(await token.mintingFinished.call(), "minting should be enabled");

      await increaseTimeTo(timings[2] + duration.minutes(1));
      await crowdsale.finalize();

      assert.isTrue(await token.mintingFinished.call(), "minting should be finished");
    });
  });

  describe("finalization", () => {
    it("should not enable refunds if soft cap was reached", async () => {
      let softCap = new BigNumber(await crowdsale.goal.call());
      await crowdsale.sendTransaction({
        from: ACC_1,
        value: softCap.toNumber()
      });

      await increaseTimeTo(timings[2] + duration.minutes(1));

      await crowdsale.finalize();

      await expectThrow(crowdsale.claimRefund({
        from: ACC_1
      }), "should not refund if soft cap reached");
    });
  });

  describe("claimRefund", () => {
    it("should refund correctly", async () => {
      await crowdsale.sendTransaction({
        from: ACC_1,
        value: ether(2)
      });

      await increaseTimeTo(timings[2] + duration.minutes(1));

      await crowdsale.finalize();

      let balanceBefore = new BigNumber(await web3.eth.getBalance(ACC_1));

      let txHash = await crowdsale.claimRefund({
        from: ACC_1
      });
      let gasUsed = new BigNumber(txHash.receipt.gasUsed);
      const gasPrice = await new BigNumber(web3.eth.getTransaction(txHash.tx).gasPrice);
      let txPrice = gasUsed.multipliedBy(gasPrice);

      let balanceAfter = new BigNumber(await web3.eth.getBalance(ACC_1));
      assert.equal(balanceAfter.minus(balanceBefore).plus(txPrice).toNumber(), ether(2).toNumber(), "wrong balance after refund");
    });

    it("should not refund to address, which deposited 0", async () => {
      await crowdsale.sendTransaction({
        from: ACC_1,
        value: ether(2)
      });

      await increaseTimeTo(timings[2] + duration.minutes(1));

      await crowdsale.finalize();

      let balanceBefore = new BigNumber(await web3.eth.getBalance(ACC_2));
      let txHash = await crowdsale.claimRefund({
        from: ACC_2
      });
      let gasUsed = new BigNumber(txHash.receipt.gasUsed);
      const gasPrice = await new BigNumber(web3.eth.getTransaction(txHash.tx).gasPrice);
      let txPrice = gasUsed.multipliedBy(gasPrice);

      let balanceAfter = new BigNumber(await web3.eth.getBalance(ACC_2));
      assert.equal(balanceBefore.minus(balanceAfter).toNumber(), txPrice.toNumber(), "wrong balance after refund, nothing should be refunded");
    });

    it("should not receive funds before finalization", async () => {
      await crowdsale.sendTransaction({
        from: ACC_1,
        value: ether(2)
      });

      await increaseTimeTo(timings[1] + duration.minutes(1));

      await expectThrow(crowdsale.claimRefund({
        from: ACC_1
      }), "should throw if claimRefund before finalized");
    });
  });
});