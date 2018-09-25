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

contract("Timing", (accounts) => {
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

    crowdsale = await MRC_Crowdsale.new(mock.rate, token.address, wallet, TIMINGS);
    await token.transferOwnership(crowdsale.address);
  });

  describe("has opened", () => {
    it("should valide hasOpened is false until crowdsale open timestamp", async () => {
      assert.isFalse(await crowdsale.hasOpened.call(), "should not be opened yet");
    });

    it("should valide hasOpened is true after crowdsale open timestamp", async () => {
      let opening = new BigNumber(await crowdsale.openingTime.call());
      await increaseTimeTo(opening.plus(duration.seconds(1)));
      assert.isTrue(await crowdsale.hasOpened.call(), "should be already opened");
    });
  });
});