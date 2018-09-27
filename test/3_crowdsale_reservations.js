const MRC_Token = artifacts.require("MRC_Token");
const MRC_Crowdsale = artifacts.require("./MRC_Crowdsale.sol");
const BigNumber = require("bignumber.js");

import {
  advanceBlock
} from './helpers/advanceToBlock.js';

import {
  duration
} from "./helpers/increaseTime";
import expectThrow from './helpers/expectThrow';
import crowdsaleMock from "./helpers/mocks/crowdsaleMock";

contract("Reservations", (accounts) => {
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

  describe("reservation calculations", () => {
    it("should validate tokensReservedFor team amount is correct", async () => {
      let teamTokens = new BigNumber(await crowdsale.tokensReservedFor(0));
      assert.equal(teamTokens.toNumber(), 140000000 * (10 ** 8), "wrong team tokens transferred");
    });

    it("should validate tokensReservedFor bounty amount is correct", async () => {
      let bountyTokens = new BigNumber(await crowdsale.tokensReservedFor(1));
      assert.equal(bountyTokens.toNumber(), 50000000 * (10 ** 8), "wrong bounty tokens transferred");
    });

    it("should validate tokensReservedFor development amount is correct", async () => {
      let developmentTokens = new BigNumber(await crowdsale.tokensReservedFor(2));
      assert.equal(developmentTokens.toNumber(), 150000000 * (10 ** 8), "wrong development tokens transferred");
    });

    it("should validate tokensReservedFor token sale amount is correct", async () => {
      let saleTokens = new BigNumber(await crowdsale.tokensReservedFor(3));
      assert.equal(saleTokens.toNumber(), 10000000 * (10 ** 8), "wrong sale tokens transferred");
    });
  });

  describe("not owner is able to transfer reservations", () => {
    it("should throw if not owner tries to transfer reservations", async () => {
      await expectThrow(crowdsale.transferReservationTeam(ACC_1, {
        from: ACC_1
      }), "not owner is not allowed to transfer reservations");
    });
  });

  describe("validate reservations transfer success", () => {
    it("should validate reservation Team delivered succesfully", async () => {
      let tokenReserve = new BigNumber(await crowdsale.tokensReservedFor(0));
      let tokensBefore = new BigNumber(await token.balanceOf(ACC_1));

      await crowdsale.transferReservationTeam(ACC_1);

      let tokensAfter = new BigNumber(await token.balanceOf(ACC_1));
      assert.equal(tokensAfter.minus(tokensBefore).toNumber(), tokenReserve.toNumber(), "wrong tokens transferred during reservation Team");
    });

    it("should validate reservation Bounty delivered succesfully", async () => {
      let tokenReserve = new BigNumber(await crowdsale.tokensReservedFor(1));
      let tokensBefore = new BigNumber(await token.balanceOf(ACC_1));

      await crowdsale.transferReservationBounty(ACC_1);

      let tokensAfter = new BigNumber(await token.balanceOf(ACC_1));
      assert.equal(tokensAfter.minus(tokensBefore).toNumber(), tokenReserve.toNumber(), "wrong tokens transferred during reservation Bounty");
    });

    it("should validate reservation Development delivered succesfully", async () => {
      let tokenReserve = new BigNumber(await crowdsale.tokensReservedFor(2));
      let tokensBefore = new BigNumber(await token.balanceOf(ACC_1));

      await crowdsale.transferReservationDevelopment(ACC_1);

      let tokensAfter = new BigNumber(await token.balanceOf(ACC_1));
      assert.equal(tokensAfter.minus(tokensBefore).toNumber(), tokenReserve.toNumber(), "wrong tokens transferred during reservation Development");
    });

    it("should validate reservation Sale delivered succesfully", async () => {
      let tokenReserve = new BigNumber(await crowdsale.tokensReservedFor(3));
      let tokensBefore = new BigNumber(await token.balanceOf(ACC_1));

      await crowdsale.transferReservationSale(ACC_1);

      let tokensAfter = new BigNumber(await token.balanceOf(ACC_1));
      assert.equal(tokensAfter.minus(tokensBefore).toNumber(), tokenReserve.toNumber(), "wrong tokens transferred during reservation Sale");
    });
  });

  describe("reservations got cleared after transfer", () => {
    it("should validate no team reservation team after transfer", async () => {
      await crowdsale.transferReservationTeam(ACC_1);
      let tokens = new BigNumber(await crowdsale.tokensReservedFor(0));
      assert.equal(tokens.toNumber(), 0, "team reservation should be cleared after transfer");
    });

    it("should validate no bounty reservation team after transfer", async () => {
      await crowdsale.transferReservationBounty(ACC_1);
      let tokens = new BigNumber(await crowdsale.tokensReservedFor(1));
      assert.equal(tokens.toNumber(), 0, "bounty reservation should be cleared after transfer");
    });

    it("should validate no development reservation team after transfer", async () => {
      await crowdsale.transferReservationDevelopment(ACC_1);
      let tokens = new BigNumber(await crowdsale.tokensReservedFor(2));
      assert.equal(tokens.toNumber(), 0, "development reservation should be cleared after transfer");
    });

    it("should validate no token sale reservation team after transfer", async () => {
      await crowdsale.transferReservationSale(ACC_1);
      let tokens = new BigNumber(await crowdsale.tokensReservedFor(3));
      assert.equal(tokens.toNumber(), 0, "token sale reservation should be cleared after transfer");
    });
  });

  describe("reservation events are emitted on transfer", () => {
    it("should validate team reservation transfer event on transfer", async () => {
      let tokens = new BigNumber(await crowdsale.tokensReservedFor(0));

      let tx = await crowdsale.transferReservationTeam(ACC_1);
      let logs = tx.logs;

      assert.equal(logs.length, 1, "should be 1 event");
      let log = logs[0];
      assert.equal(log.event, "TeamReserveTransferred", "wrong event on team reservation transfer");
      assert.equal(log.args._address, ACC_1, "wrong address on event on team reservation transfer");
      assert.equal(new BigNumber(log.args._amount).toNumber(), tokens.toNumber(), "wrong tokens on event on team reservation transfer");
    });

    it("should validate bounty reservation transfer event on transfer", async () => {
      let tokens = new BigNumber(await crowdsale.tokensReservedFor(1));

      let tx = await crowdsale.transferReservationBounty(ACC_1);
      let logs = tx.logs;

      assert.equal(logs.length, 1, "should be 1 event");
      let log = logs[0];
      assert.equal(log.event, "BountyReserveTransferred", "wrong event on bounty reservation transfer");
      assert.equal(log.args._address, ACC_1, "wrong address on event on bounty reservation transfer");
      assert.equal(new BigNumber(log.args._amount).toNumber(), tokens.toNumber(), "wrong tokens on event on bounty reservation transfer");
    });

    it("should validate development reservation transfer event on transfer", async () => {
      let tokens = new BigNumber(await crowdsale.tokensReservedFor(2));

      let tx = await crowdsale.transferReservationDevelopment(ACC_1);
      let logs = tx.logs;

      assert.equal(logs.length, 1, "should be 1 event");
      let log = logs[0];
      assert.equal(log.event, "DevelopmentReserveTransferred", "wrong event on development reservation transfer");
      assert.equal(log.args._address, ACC_1, "wrong address on event on development reservation transfer");
      assert.equal(new BigNumber(log.args._amount).toNumber(), tokens.toNumber(), "wrong tokens on event on development reservation transfer");
    });

    it("should validate sale cost reservation transfer event on transfer", async () => {
      let tokens = new BigNumber(await crowdsale.tokensReservedFor(3));

      let tx = await crowdsale.transferReservationSale(ACC_1);
      let logs = tx.logs;

      assert.equal(logs.length, 1, "should be 1 event");
      let log = logs[0];
      assert.equal(log.event, "SaleReserveTransferred", "wrong event on sale cost reservation transfer");
      assert.equal(log.args._address, ACC_1, "wrong address on event on sale cost reservation transfer");
      assert.equal(new BigNumber(log.args._amount).toNumber(), tokens.toNumber(), "wrong tokens on event on sale cost reservation transfer");
    });
  });

  describe("modifier validation", () => {
    it("should validate nonZeroAddressOnly modifier", async () => {
      await expectThrow(crowdsale.transferReservationSale(0), "should throw if beneficiary address == 0");
    });
  });
});