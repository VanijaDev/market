const MRC_Token = artifacts.require("MRC_Token");

const BigNumber = require('bignumber.js');

import {
  advanceBlock
} from './helpers/advanceToBlock.js';

import expectThrow from './helpers/expectThrow';


contract("MRC_Token", (accounts) => {
  let token;
  const ACC_1 = accounts[1];

  beforeEach("create token inst", async () => {
    await advanceBlock();

    token = await MRC_Token.new();
  });

  it("should validate total supply", async () => {
    assert.equal(new BigNumber(await token.totalSupplyMax.call()).toNumber(), new BigNumber(100000000000000000).toNumber(), "wrong totalSupplyMax");
  });

  it("should not mint more than max limit", async () => {
    let limit = new BigNumber(await token.totalSupplyMax.call());
    let limit_2_of_3 = limit.multipliedBy(2).dividedBy(3);

    await token.mint(ACC_1, limit_2_of_3.toNumber());
    await expectThrow(token.mint(ACC_1, limit_2_of_3.toNumber()), "should not allow to mint more than limit");
  });
});