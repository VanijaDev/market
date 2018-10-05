const MRC_Token = artifacts.require("MRC_Token");
const MRC_Crowdsale = artifacts.require("./MRC_Crowdsale.sol");
const MRC_VestingEscrow = artifacts.require("./MRC_VestingEscrow.sol");
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
import latestTime from "./helpers/latestTime.js";

contract("Team vesting escrow", (accounts) => {
  const OWNER = accounts[0];
  const ACC_1 = accounts[1];
  const ACC_2 = accounts[2];

  let token;
  let crowdsale;
  let icoStart;

  let timings;
  let wallet = accounts[9];
  let vestingEscrow;

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

    vestingEscrow = await MRC_VestingEscrow.new(token.address);
  });

  describe("team tokens", () => {
    it("should validate vesting times are correct after times update", async () => {
      let vestingEscrow = await MRC_VestingEscrow.new(token.address);

      let vesting_0 = latestTime() + duration.minutes(1);
      let vesting_1 = latestTime() + duration.minutes(2);
      let vesting_2 = latestTime() + duration.minutes(3);
      let vesting_3 = latestTime() + duration.minutes(4);
      await vestingEscrow.updatedVestingTimes([vesting_0, vesting_1, vesting_2, vesting_3]);

      assert.equal(new BigNumber(await vestingEscrow.vestingTimes.call(0)).toNumber(), vesting_0, "wrong vesting_0 time after update");
      assert.equal(new BigNumber(await vestingEscrow.vestingTimes.call(1)).toNumber(), vesting_1, "wrong vesting_1 time after update");
      assert.equal(new BigNumber(await vestingEscrow.vestingTimes.call(2)).toNumber(), vesting_2, "wrong vesting_2 time after update");
      assert.equal(new BigNumber(await vestingEscrow.vestingTimes.call(3)).toNumber(), vesting_3, "wrong vesting_3 time after update");
    });

    it("should validate not owner can not update vesting times", async () => {
      let vesting_0 = latestTime() + duration.minutes(1);
      let vesting_1 = latestTime() + duration.minutes(2);
      let vesting_2 = latestTime() + duration.minutes(3);
      let vesting_3 = latestTime() + duration.minutes(4);
      await expectThrow(vestingEscrow.updatedVestingTimes([vesting_0, vesting_1, vesting_2, vesting_3], {
        from: ACC_1
      }), "should throw if not owner tries to update vesting times");
    });

    it("should validate minimumContractBalance are correct after times update", async () => {
      let tokenReserve = new BigNumber(await crowdsale.tokensReservedFor(0));
      let tokensBefore = new BigNumber(await token.balanceOf(vestingEscrow.address));

      await crowdsale.transferReservationTeam(vestingEscrow.address);

      let tokensAfter = new BigNumber(await token.balanceOf(vestingEscrow.address));

      assert.equal(tokensAfter.minus(tokensBefore).toNumber(), tokenReserve.toNumber(), "wrong tokens transferred for reservation Team");

      await vestingEscrow.calculateVestingPortions();

      let vesting_0_prev = new BigNumber(await vestingEscrow.vestingTimes.call(0));
      let vesting_1_prev = new BigNumber(await vestingEscrow.vestingTimes.call(1));
      let vesting_2_prev = new BigNumber(await vestingEscrow.vestingTimes.call(2));
      let vesting_3_prev = new BigNumber(await vestingEscrow.vestingTimes.call(3));

      let minimumContractBalance_0_prev = new BigNumber(await vestingEscrow.minimumContractBalance.call(vesting_0_prev.toNumber()));
      let minimumContractBalance_1_prev = new BigNumber(await vestingEscrow.minimumContractBalance.call(vesting_1_prev.toNumber()));
      let minimumContractBalance_2_prev = new BigNumber(await vestingEscrow.minimumContractBalance.call(vesting_2_prev.toNumber()));
      let minimumContractBalance_3_prev = new BigNumber(await vestingEscrow.minimumContractBalance.call(vesting_3_prev.toNumber()));

      let vesting_0 = latestTime() + duration.minutes(1);
      let vesting_1 = latestTime() + duration.minutes(2);
      let vesting_2 = latestTime() + duration.minutes(3);
      let vesting_3 = latestTime() + duration.minutes(4);
      await vestingEscrow.updatedVestingTimes([vesting_0, vesting_1, vesting_2, vesting_3]);

      let minimumContractBalance_0 = new BigNumber(await vestingEscrow.minimumContractBalance.call(vesting_0));
      let minimumContractBalance_1 = new BigNumber(await vestingEscrow.minimumContractBalance.call(vesting_1));
      let minimumContractBalance_2 = new BigNumber(await vestingEscrow.minimumContractBalance.call(vesting_2));
      let minimumContractBalance_3 = new BigNumber(await vestingEscrow.minimumContractBalance.call(vesting_3));

      assert.equal(minimumContractBalance_0.toNumber(), minimumContractBalance_0_prev.toNumber(), "wrong minimumContractBalance_0 after times update");
      assert.equal(minimumContractBalance_1.toNumber(), minimumContractBalance_1_prev.toNumber(), "wrong minimumContractBalance_1 after times update");
      assert.equal(minimumContractBalance_2.toNumber(), minimumContractBalance_2_prev.toNumber(), "wrong minimumContractBalance_2 after times update");
      assert.equal(minimumContractBalance_3.toNumber(), minimumContractBalance_3_prev.toNumber(), "wrong minimumContractBalance_3 after times update");
    });
  });

  describe("token transfers from vesting escrow", () => {
    it("should not exceed available transfer limit for vesting period_0", async () => {
      await crowdsale.transferReservationTeam(vestingEscrow.address);
      await vestingEscrow.calculateVestingPortions();

      let vesting_0 = latestTime() + duration.minutes(1);
      let vesting_1 = latestTime() + duration.minutes(2);
      let vesting_2 = latestTime() + duration.minutes(3);
      let vesting_3 = latestTime() + duration.minutes(4);
      await vestingEscrow.updatedVestingTimes([vesting_0, vesting_1, vesting_2, vesting_3]);
      await increaseTimeTo(vesting_0 + 1);

      let tokensTotal = new BigNumber(await token.balanceOf(vestingEscrow.address));
      let minimumContractBalance_0 = new BigNumber(await vestingEscrow.minimumContractBalance.call(vesting_0));
      let maxTokens = tokensTotal.minus(minimumContractBalance_0);

      await expectThrow(vestingEscrow.transferTokens(ACC_1, maxTokens.plus(1).toNumber()), "should not allow to transfer more than minimumContractBalance_0 limit");
    });

    it("should not exceed available transfer limit for vesting period_1", async () => {
      await crowdsale.transferReservationTeam(vestingEscrow.address);
      await vestingEscrow.calculateVestingPortions();

      let vesting_0 = latestTime() + duration.minutes(1);
      let vesting_1 = latestTime() + duration.minutes(2);
      let vesting_2 = latestTime() + duration.minutes(3);
      let vesting_3 = latestTime() + duration.minutes(4);
      await vestingEscrow.updatedVestingTimes([vesting_0, vesting_1, vesting_2, vesting_3]);
      await increaseTimeTo(vesting_1 + 1);

      let tokensTotal = new BigNumber(await token.balanceOf(vestingEscrow.address));
      let minimumContractBalance_1 = new BigNumber(await vestingEscrow.minimumContractBalance.call(vesting_1));
      let maxTokens = tokensTotal.minus(minimumContractBalance_1);

      await expectThrow(vestingEscrow.transferTokens(ACC_1, maxTokens.plus(1).toNumber()), "should not allow to transfer more than minimumContractBalance_1 limit");
    });

    it("should not exceed available transfer limit for vesting period_2", async () => {
      await crowdsale.transferReservationTeam(vestingEscrow.address);
      await vestingEscrow.calculateVestingPortions();

      let vesting_0 = latestTime() + duration.minutes(1);
      let vesting_1 = latestTime() + duration.minutes(2);
      let vesting_2 = latestTime() + duration.minutes(3);
      let vesting_3 = latestTime() + duration.minutes(4);
      await vestingEscrow.updatedVestingTimes([vesting_0, vesting_1, vesting_2, vesting_3]);
      await increaseTimeTo(vesting_2 + 1);

      let tokensTotal = new BigNumber(await token.balanceOf(vestingEscrow.address));
      let minimumContractBalance_2 = new BigNumber(await vestingEscrow.minimumContractBalance.call(vesting_2));
      let maxTokens = tokensTotal.minus(minimumContractBalance_2);

      await expectThrow(vestingEscrow.transferTokens(ACC_1, maxTokens.plus(2).toNumber()), "should not allow to transfer more than minimumContractBalance_2 limit");
    });

    it("should not exceed available transfer limit for vesting period_3", async () => {
      await crowdsale.transferReservationTeam(vestingEscrow.address);
      await vestingEscrow.calculateVestingPortions();

      let vesting_0 = latestTime() + duration.minutes(1);
      let vesting_1 = latestTime() + duration.minutes(2);
      let vesting_2 = latestTime() + duration.minutes(3);
      let vesting_3 = latestTime() + duration.minutes(4);
      await vestingEscrow.updatedVestingTimes([vesting_0, vesting_1, vesting_2, vesting_3]);
      await increaseTimeTo(vesting_3 + 1);

      let tokensTotal = new BigNumber(await token.balanceOf(vestingEscrow.address));
      let minimumContractBalance_3 = new BigNumber(await vestingEscrow.minimumContractBalance.call(vesting_3));
      let maxTokens = tokensTotal.minus(minimumContractBalance_3);

      await expectThrow(vestingEscrow.transferTokens(ACC_1, maxTokens.plus(2).toNumber()), "should not allow to transfer more than minimumContractBalance_3 limit");
    });

    it("should throw if not owner tries to transfer", async () => {
      await crowdsale.transferReservationTeam(vestingEscrow.address);
      await vestingEscrow.calculateVestingPortions();

      let vesting_0 = latestTime() + duration.minutes(1);
      let vesting_1 = latestTime() + duration.minutes(2);
      let vesting_2 = latestTime() + duration.minutes(3);
      let vesting_3 = latestTime() + duration.minutes(4);
      await vestingEscrow.updatedVestingTimes([vesting_0, vesting_1, vesting_2, vesting_3]);
      await increaseTimeTo(vesting_3 + 1);

      let tokensTotal = new BigNumber(await token.balanceOf(vestingEscrow.address));
      let minimumContractBalance_3 = new BigNumber(await vestingEscrow.minimumContractBalance.call(vesting_3));
      let maxTokens = tokensTotal.minus(minimumContractBalance_3);

      await expectThrow(vestingEscrow.transferTokens(ACC_1, maxTokens.minus(2).toNumber(), {
        from: ACC_1
      }), "should not allow to transfer more than minimumContractBalance_3 limit");

    });
  });
});