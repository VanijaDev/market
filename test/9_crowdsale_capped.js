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

contract("Cap", (accounts) => {
  const OWNER = accounts[0];
  const ACC_1 = accounts[1];
  const ACC_2 = accounts[2];

  let token;
  let crowdsale;
  let icoStart;

  let timings;

  beforeEach("create crowdsale inst", async () => {
    await advanceBlock();

    const OPENING = latestTime() + duration.hours(1);
    const ICO_START = OPENING + duration.hours(1);
    const CLOSING = ICO_START + duration.hours(1);
    timings = [OPENING, ICO_START, CLOSING];

    icoStart = ICO_START;

    let mock = crowdsaleMock();
    let wallet = accounts[9];

    token = await MRC_Token.new();
    crowdsale = await MRC_Crowdsale.new(mock.rateETH, token.address, wallet, timings);
    await token.transferOwnership(crowdsale.address);

    await crowdsale.addToWhitelist(ACC_1, ACC_1);
    await increaseTimeTo(OPENING + duration.minutes(1));
  });

  describe("cap limit", () => {
    it("should not sell tokens more than cap limit by single purchase", async () => {
      //  hard cap = 7 ETH

      await expectThrow(crowdsale.sendTransaction({
        from: ACC_1,
        value: ether(8)
      }), "should not allow to purchase more than hard cap");
    });

    it("should not sell tokens more than cap limit by multiple purchases", async () => {
      //  hard cap = 7 ETH

      crowdsale.sendTransaction({
        from: ACC_1,
        value: ether(6)
      })

      await expectThrow(crowdsale.sendTransaction({
        from: ACC_1,
        value: ether(3)
      }), "should not allow to purchase more than hard cap on second purchase");
    });
  });

});