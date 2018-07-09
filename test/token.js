let MRC_Token = artifacts.require("./MRC_Token");

import {
  advanceBlock
} from './helpers/advanceToBlock.js';

var BigNumber = require('bignumber.js');


contract("MRC_Token", () => {
  let token;

  before("setup", async () => {
    advanceBlock();
  });

  it("should validate total supply", async () => {
    // assert.equal(new BigNumber(await token.totalSupplyMax.call()).toNumber(), new BigNumber(100000000000000000).toNumber(), "wrong totalSupplyMax");
  });

  it("should not mint more than max limit", async () => {

  });
});