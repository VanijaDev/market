const MRC_Token = artifacts.require("MRC_Token");
const MRC_Crowdsale = artifacts.require("./MRC_Crowdsale.sol");


import {
  advanceBlock
} from './helpers/advanceToBlock.js';
import {
  duration
} from "./helpers/increaseTime";

import expectThrow from './helpers/expectThrow';
import crowdsaleMock from "./helpers/mocks/crowdsaleMock";


contract("MRC_WhitelistedSourceDestination", (accounts) => {
  const OWNER = accounts[0];
  const ACC_1 = accounts[1];
  const ACC_2 = accounts[2];

  let token;
  let crowdsale;

  before("setup", async () => {
    await advanceBlock();
  });

  beforeEach("create new instances", async () => {
    token = await MRC_Token.new();

    let mock = crowdsaleMock();
    let wallet = accounts[9];

    const OPENING = web3.eth.getBlock("latest").timestamp + duration.hours(1);
    const ICO_START = OPENING + duration.hours(1);
    const CLOSING = ICO_START + duration.hours(1);
    const TIMINGS = [OPENING, ICO_START, CLOSING];

    crowdsale = await MRC_Crowdsale.new(mock.rate, wallet, token.address, mock.reservations, TIMINGS);
    await token.transferOwnership(crowdsale.address);
  });

  describe("add to whiteist functional", () => {
    it("should allow owner to add to whitelist", async () => {
      await crowdsale.addToWhitelist(ACC_1, ACC_2);
    });

    it("should not allow not owner to add to whitelst", async () => {
      await expectThrow(crowdsale.addToWhitelist(ACC_1, ACC_2, {
        from: ACC_1
      }), "should not allow not owner to add");
    });

    it("should validate correct relation in whitelist after addToWhitelist", async () => {
      let ACC_3 = accounts[3];
      let ACC_4 = accounts[4];
      await crowdsale.addToWhitelist(ACC_1, ACC_2);
      await crowdsale.addToWhitelist(ACC_3, ACC_4);

      assert.equal(await crowdsale.whitelist.call(ACC_1), ACC_2, "wrong destination for ACC_1");
      assert.equal(await crowdsale.whitelist.call(ACC_3), ACC_4, "wrong destination for ACC_3");

      await crowdsale.addToWhitelist(ACC_1, ACC_1);
      assert.equal(await crowdsale.whitelist.call(ACC_1), ACC_1, "wrong destination for ACC_1, should be again ACC_1");
    });

    it("should not allow source address to be 0", async () => {
      await expectThrow(crowdsale.addToWhitelist(0, ACC_2), "source address can not be 0");
    });

    it("should not allow destination address to be 0", async () => {
      await expectThrow(crowdsale.addToWhitelist(ACC_1, 0), "destination address can not be 0");
    });
  });

  describe("add many to whiteist functional", () => {
    it("should allow owner to add many to whitelist", async () => {
      await crowdsale.addManyToWhitelist([ACC_1], [ACC_2]);
    });

    it("should not allow not owner to add many to whitelst", async () => {
      await expectThrow(crowdsale.addToWhitelist([ACC_1], [ACC_2], {
        from: ACC_1
      }), "should not allow not owner to add");
    });

    it("should validate correct relation in whitelist after addManyToWhitelist", async () => {
      let ACC_3 = accounts[3];
      let ACC_4 = accounts[4];
      await crowdsale.addManyToWhitelist([ACC_1, ACC_3], [ACC_2, ACC_4]);

      assert.equal(await crowdsale.whitelist.call(ACC_1), ACC_2, "wrong destination for ACC_1");
      assert.equal(await crowdsale.whitelist.call(ACC_3), ACC_4, "wrong destination for ACC_3");
    });

    it("should not allow any source address to be 0", async () => {
      let ACC_3 = accounts[3];
      let ACC_4 = accounts[4];
      await expectThrow(crowdsale.addManyToWhitelist([ACC_1, ACC_3], [0, ACC_4]), "source address in array is 0, which is not allowed");

    });

    it.only("should not allow any destination address to be 0", async () => {
      let ACC_3 = accounts[3];
      let ACC_4 = accounts[4];
      await expectThrow(crowdsale.addManyToWhitelist([ACC_1, 0], [ACC_2, ACC_4]), "destination address in array is 0, which is not allowed");

    });
  });

  describe("remove from whiteist functional", () => {
    it("should allow owner to remove from whitelist", async () => {
      await crowdsale.addToWhitelist(ACC_1, ACC_2);
      assert.equal(await crowdsale.whitelist.call(ACC_1), ACC_2, "wrong destination for ACC_1");

      await crowdsale.removeFromWhitelist(ACC_1);
      assert.equal(await crowdsale.whitelist.call(ACC_1), 0, "destination address should be 0");
    });

    it("should not allow not owner to add to whitelst", async () => {
      await expectThrow(crowdsale.addToWhitelist(ACC_1, ACC_2, {
        from: ACC_1
      }), "should not allow not owner to add");
    });

    it("should validate correct relation in whitelist after addToWhitelist", async () => {
      let ACC_3 = accounts[3];
      let ACC_4 = accounts[4];
      await crowdsale.addToWhitelist(ACC_1, ACC_2);
      await crowdsale.addToWhitelist(ACC_3, ACC_4);

      assert.equal(await crowdsale.whitelist.call(ACC_1), ACC_2, "wrong destination for ACC_1");
      assert.equal(await crowdsale.whitelist.call(ACC_3), ACC_4, "wrong destination for ACC_3");
    });
  });
});