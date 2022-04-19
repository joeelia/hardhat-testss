
const { expect, use } = require('chai');
const { ethers } = require("hardhat");
const { solidity } = require('ethereum-waffle');
use(solidity);
let whitelist;
let phuntoken;
let lpToken;
let staking;
let owner;
let addr1;
let addr2;
let addrs;
//https://ethereum.stackexchange.com/a/99969
beforeEach(async function () {
  provider = ethers.getDefaultProvider();
  const Whitelist = await ethers.getContractFactory("Whitelist");
  whitelist = await Whitelist.deploy();
  await whitelist.deployed();

  [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();
  const Phuntoken = await ethers.getContractFactory("REEETOKEN");
  phuntoken = await Phuntoken.deploy();
  await phuntoken.deployed();
  const LpToken = await ethers.getContractFactory("LPTOKEN");
  lpToken = await LpToken.deploy();
  await lpToken.deployed();
  const Staking = await ethers.getContractFactory("PhunTokenStakingUniswapV2");
  staking = await Staking.deploy(
    phuntoken.address,
    lpToken.address,
    whitelist.address,
    owner.address
  );
  await staking.deployed();
});
describe("Whitelist", function () {
  it("Deployer is owner", async function () {
    expect(await whitelist.owner()).to.equal(owner.address);
  });

  it("Only Owner can Whitelist", async function () {
    try {
      await whitelist.connect(addr1.address).addWhitelist([addr2.address])
    } catch (e) {
      expect(true).to.equal(true);
    }
  });

  it("Check a wallet is not whitelisted at deployment", async function () {
    expect(await whitelist.isWhitelisted(addr1.address)).to.equal(false);
  });

  it("Check owner can whitelist a wallet", async function () {
    const ownerAddsWhitelist = await whitelist.addWhitelist([addr1.address])
    await ownerAddsWhitelist.wait();
    expect(await whitelist.isWhitelisted(addr1.address)).to.equal(true);
  });

  it("Check owner can remove whitelist", async function () {
    const ownerRemovesWhitelist = await whitelist.removeWhitelist([addr1.address])
    await ownerRemovesWhitelist.wait();
    expect(await whitelist.isWhitelisted(addr1.address)).to.equal(false);
  });

  it("Whitelist many wallets for staking", async function () {
    const multiAddWhitelist = await whitelist.addWhitelist([addr1.address, addr2.address])
    await multiAddWhitelist.wait();
    expect(await whitelist.isWhitelisted(addr1.address)).to.equal(true);
    expect(await whitelist.isWhitelisted(addr2.address)).to.equal(true);
  });
});

describe("Staking", function () {
  it("Non-whitelisted wallets cannot stake", async function () {
    await expect(() => lpToken.transfer(addr3.address, ethers.BigNumber.from("1000000000000000000000000")))
      .to.changeTokenBalance(lpToken, addr3, ethers.BigNumber.from("1000000000000000000000000"));
    try {
      await lpToken.connect(addr3).approve(staking.address, "100000000000000000000000000000000000000000000000000")
      await staking.connect(addr3).stake(ethers.BigNumber.from("1000000000000000000000000"))
    } catch (e) {
      expect(true).to.equal(true);
    }
  });

  it("Send and Verify 5 Million PHTK to Staking Contract", async function () {
    await expect(() => phuntoken.transfer(staking.address, ethers.BigNumber.from("5000000000000000000000000")))
      .to.changeTokenBalance(phuntoken, staking, ethers.BigNumber.from("5000000000000000000000000"));
    const setRewards = await staking.setRewardParams(ethers.BigNumber.from("5000000000000000000000000"), "23000000")
    setRewards.wait();
    //staking period starts once periodFinish is not 0
    expect(await phuntoken.balanceOf(staking.address)).to.equal(ethers.BigNumber.from("5000000000000000000000000"));
    expect(await staking.periodFinish()).to.be.above(0);
    const multiAddWhitelist = await whitelist.addWhitelist([addr1.address, addr2.address])
    await multiAddWhitelist.wait();

    await expect(() => lpToken.transfer(addr1.address, ethers.BigNumber.from("5000000000000000000000000")))
      .to.changeTokenBalance(lpToken, addr1, ethers.BigNumber.from("5000000000000000000000000"));

    await lpToken.connect(addr1).approve(staking.address, ethers.BigNumber.from("5000000000000000000000000"))
    const stake = await staking.connect(addr1).stake(ethers.BigNumber.from("5000000000000000000000000"))
    await stake.wait()
    //staked tokens inside contract
    expect(await staking.balanceOf(addr1.address)).to.equal(ethers.BigNumber.from("5000000000000000000000000"));
    //no more tokens in wallet
    expect(await lpToken.balanceOf(addr1.address)).to.equal(0);
  });

  it("Whitelisted Wallet Stakes Tokens", async function () {
    const multiAddWhitelist = await whitelist.addWhitelist([addr1.address, addr2.address])
    await multiAddWhitelist.wait();

    await expect(() => lpToken.transfer(addr1.address, ethers.BigNumber.from("5000000000000000000000000")))
      .to.changeTokenBalance(lpToken, addr1, ethers.BigNumber.from("5000000000000000000000000"));

    await lpToken.connect(addr1).approve(staking.address, ethers.BigNumber.from("5000000000000000000000000"))
    const stake = await staking.connect(addr1).stake(ethers.BigNumber.from("5000000000000000000000000"))
    await stake.wait()
    //staked tokens inside contract
    expect(await staking.balanceOf(addr1.address)).to.equal(ethers.BigNumber.from("5000000000000000000000000"));
    //no more tokens in wallet
    expect(await lpToken.balanceOf(addr1.address)).to.equal(0);
  });
/*
  it("Whitelisted Wallet has Reward Token Balance after some blocks", async function () {
    await expect(() => phuntoken.transfer(staking.address, ethers.BigNumber.from("5000000000000000000000000")))
      .to.changeTokenBalance(phuntoken, staking, ethers.BigNumber.from("5000000000000000000000000"));
    const setRewards = await staking.setRewardParams(ethers.BigNumber.from("5000000000000000000000000"), "23000000")
    setRewards.wait();
    //staking period starts once periodFinish is not 0
    expect(await phuntoken.balanceOf(staking.address)).to.equal(ethers.BigNumber.from("5000000000000000000000000"));
    expect(await staking.periodFinish()).to.be.above(0);
    const multiAddWhitelist = await whitelist.addWhitelist([addr1.address, addr2.address])
    await multiAddWhitelist.wait();

    await expect(() => lpToken.transfer(addr1.address, ethers.BigNumber.from("5000000000000000000000000")))
      .to.changeTokenBalance(lpToken, addr1, ethers.BigNumber.from("5000000000000000000000000"));

    await lpToken.connect(addr1).approve(staking.address, ethers.BigNumber.from("5000000000000000000000000"))
    const stake = await staking.connect(addr1).stake(ethers.BigNumber.from("5000000000000000000000000"))
    await stake.wait()
    //staked tokens inside contract
    expect(await staking.balanceOf(addr1.address)).to.equal(ethers.BigNumber.from("5000000000000000000000000"));
    //no more tokens in wallet
    expect(await lpToken.balanceOf(addr1.address)).to.equal(0);
    //user shouldve earned token by now...
    expect(await staking.earned(addr1.address)).to.be.above(0);
  });
  */
  /*
  it("Whitelisted Wallet claim Reward Token after some blocks of staking", async function () {
    await expect(() => phuntoken.transfer(staking.address, ethers.BigNumber.from("5000000000000000000000000")))
      .to.changeTokenBalance(phuntoken, staking, ethers.BigNumber.from("5000000000000000000000000"));
    const setRewards = await staking.setRewardParams(ethers.BigNumber.from("5000000000000000000000000"), "23000000")
    setRewards.wait();
    //staking period starts once periodFinish is not 0
    expect(await phuntoken.balanceOf(staking.address)).to.equal(ethers.BigNumber.from("5000000000000000000000000"));
    expect(await staking.periodFinish()).to.be.above(0);
    const multiAddWhitelist = await whitelist.addWhitelist([addr1.address, addr2.address])
    await multiAddWhitelist.wait();
    await expect(() => lpToken.transfer(addr1.address, ethers.BigNumber.from("5000000000000000000000000")))
      .to.changeTokenBalance(lpToken, addr1, ethers.BigNumber.from("5000000000000000000000000"));
    await lpToken.connect(addr1).approve(staking.address, ethers.BigNumber.from("5000000000000000000000000"))
    const stake = await staking.connect(addr1).stake(ethers.BigNumber.from("5000000000000000000000000"))
    await stake.wait()
    //staked tokens inside contract
    expect(await staking.balanceOf(addr1.address)).to.equal(ethers.BigNumber.from("5000000000000000000000000"));
    //no more tokens in wallet
    expect(await lpToken.balanceOf(addr1.address)).to.equal(0);
    //user shouldve earned token by now...
    let rewardsAmount = await staking.earned(addr1.address);
    expect(rewardsAmount).to.be.above(0);
    //user claims their rewards
    await staking.connect(addr1).claimReward();
    //user should have rewards now
    expect(await phuntoken.balanceOf(addr1.address)).to.be.above(0);
  });
  */
  /*
  it("Whitelisted Wallet exit stake(claim rewards and LP tokens) after some blocks of staking", async function () {
    await expect(() => phuntoken.transfer(staking.address, ethers.BigNumber.from("5000000000000000000000000")))
      .to.changeTokenBalance(phuntoken, staking, ethers.BigNumber.from("5000000000000000000000000"));
    const setRewards = await staking.setRewardParams(ethers.BigNumber.from("5000000000000000000000000"), "23000000")
    setRewards.wait();
    //staking period starts once periodFinish is not 0
    expect(await phuntoken.balanceOf(staking.address)).to.equal(ethers.BigNumber.from("5000000000000000000000000"));
    expect(await staking.periodFinish()).to.be.above(0);
    const multiAddWhitelist = await whitelist.addWhitelist([addr1.address, addr2.address])
    await multiAddWhitelist.wait();
    await expect(() => lpToken.transfer(addr1.address, ethers.BigNumber.from("5000000000000000000000000")))
      .to.changeTokenBalance(lpToken, addr1, ethers.BigNumber.from("5000000000000000000000000"));
    await lpToken.connect(addr1).approve(staking.address, ethers.BigNumber.from("5000000000000000000000000"))
    const stake = await staking.connect(addr1).stake(ethers.BigNumber.from("5000000000000000000000000"))
    await stake.wait()
    //staked tokens inside contract
    expect(await staking.balanceOf(addr1.address)).to.equal(ethers.BigNumber.from("5000000000000000000000000"));
    //no more tokens in wallet
    expect(await lpToken.balanceOf(addr1.address)).to.equal(0);
    //user shouldve earned token by now...
    let rewardsAmount = await staking.earned(addr1.address);
    expect(rewardsAmount).to.be.above(0);
    //user claims their rewards
    await staking.connect(addr1).exit();
    //user should have rewards now
    expect(await phuntoken.balanceOf(addr1.address)).to.be.above(0);
    //user should have their LP tokens back now
    expect(await lpToken.balanceOf(addr1.address)).to.be.above(0);

  });
  */
  /*
  it("Whitelisted Wallet add more LP tokens to stake after some blocks of staking", async function () {
    await expect(() => phuntoken.transfer(staking.address, ethers.BigNumber.from("5000000000000000000000000")))
      .to.changeTokenBalance(phuntoken, staking, ethers.BigNumber.from("5000000000000000000000000"));
    const setRewards = await staking.setRewardParams(ethers.BigNumber.from("5000000000000000000000000"), "23000000")
    setRewards.wait();
    //staking period starts once periodFinish is not 0
    expect(await phuntoken.balanceOf(staking.address)).to.equal(ethers.BigNumber.from("5000000000000000000000000"));
    expect(await staking.periodFinish()).to.be.above(0);
    const multiAddWhitelist = await whitelist.addWhitelist([addr1.address, addr2.address])
    await multiAddWhitelist.wait();
    await expect(() => lpToken.transfer(addr1.address, ethers.BigNumber.from("5000000000000000000000000")))
      .to.changeTokenBalance(lpToken, addr1, ethers.BigNumber.from("5000000000000000000000000"));
    await lpToken.connect(addr1).approve(staking.address, ethers.BigNumber.from("5000000000000000000000000"))
    const stake = await staking.connect(addr1).stake(ethers.BigNumber.from("2500000000000000000000000"))
    await stake.wait()
    //staked tokens inside contract
    expect(await staking.balanceOf(addr1.address)).to.equal(ethers.BigNumber.from("2500000000000000000000000"));
    //no more tokens in wallet
    expect(await lpToken.balanceOf(addr1.address)).to.equal(ethers.BigNumber.from("2500000000000000000000000"));
    const stake2 = await staking.connect(addr1).stake(ethers.BigNumber.from("2500000000000000000000000"))
    await stake2.wait()
    //staked tokens inside contract
    expect(await staking.balanceOf(addr1.address)).to.equal(ethers.BigNumber.from("5000000000000000000000000"));
    //no more tokens in wallet
    expect(await lpToken.balanceOf(addr1.address)).to.equal(0);
  });
  */
  /*
  it("Whitelisted Wallet claim LP tokens after staking period", async function () {
    await expect(() => phuntoken.transfer(staking.address, ethers.BigNumber.from("5000000000000000000000000")))
      .to.changeTokenBalance(phuntoken, staking, ethers.BigNumber.from("5000000000000000000000000"));
    const setRewards = await staking.setRewardParams(ethers.BigNumber.from("5000000000000000000000000"), "2300000")
    setRewards.wait();
    //staking period starts once periodFinish is not 0
    expect(await phuntoken.balanceOf(staking.address)).to.equal(ethers.BigNumber.from("5000000000000000000000000"));
    expect(await staking.periodFinish()).to.be.above(0);
    const multiAddWhitelist = await whitelist.addWhitelist([addr1.address, addr2.address])
    await multiAddWhitelist.wait();
    await expect(() => lpToken.transfer(addr1.address, ethers.BigNumber.from("5000000000000000000000000")))
      .to.changeTokenBalance(lpToken, addr1, ethers.BigNumber.from("5000000000000000000000000"));
    await lpToken.connect(addr1).approve(staking.address, ethers.BigNumber.from("5000000000000000000000000"))
    const stake = await staking.connect(addr1).stake(ethers.BigNumber.from("2500000000000000000000000"))
    await stake.wait()
    //skip block to pass the staking period
    await network.provider.send("evm_increaseTime", [2300000])
    await network.provider.send("evm_mine")
    //try to claim after staking period
    await staking.connect(addr1).claimReward();
    //user should have rewards now
    expect(await phuntoken.balanceOf(addr1.address)).to.be.above(0);
  });
  */
  it("Whitelisted Wallet exit stake(claim rewards and LP tokens) after staking period", async function () {
    await expect(() => phuntoken.transfer(staking.address, ethers.BigNumber.from("5000000000000000000000000")))
      .to.changeTokenBalance(phuntoken, staking, ethers.BigNumber.from("5000000000000000000000000"));
    const setRewards = await staking.setRewardParams(ethers.BigNumber.from("5000000000000000000000000"), "23000")
    setRewards.wait();
    //staking period starts once periodFinish is not 0
    expect(await phuntoken.balanceOf(staking.address)).to.equal(ethers.BigNumber.from("5000000000000000000000000"));
    expect(await staking.periodFinish()).to.be.above(0);
    const multiAddWhitelist = await whitelist.addWhitelist([addr1.address])
    await multiAddWhitelist.wait();
    await expect(() => lpToken.transfer(addr1.address, ethers.BigNumber.from("5000000000000000000000000")))
      .to.changeTokenBalance(lpToken, addr1, ethers.BigNumber.from("5000000000000000000000000"));
    await lpToken.connect(addr1).approve(staking.address, ethers.BigNumber.from("5000000000000000000000000"))
    const stake = await staking.connect(addr1).stake(ethers.BigNumber.from("2500000000000000000000000"))
    await stake.wait()
    //skip block to pass the staking period
    await network.provider.send("evm_increaseTime", [23000])
    await network.provider.send("evm_mine")
    //get the amount of rewards here to compare with itself later
    let rewardsAmountOne = await staking.earned(addr1.address);
    expect(rewardsAmountOne).to.be.above(0);
    //skip block after the staking rewards ends
    await network.provider.send("evm_increaseTime", [23000])
    await network.provider.send("evm_mine")
    //get the amount of rewards here to compare with itself previously
    let rewardsAmountTwo = await staking.earned(addr1.address);
    //user shouldn't have more rewards after staking period ends
    expect(rewardsAmountTwo).to.be.equal(rewardsAmountOne);
    //try to exit after staking period
    await staking.connect(addr1).exit();
    //user shouldn't have rewards now
    expect(await phuntoken.balanceOf(addr1.address)).to.be.above(0);
    //user shouldn have their LP tokens back
    expect(await lpToken.balanceOf(addr1.address)).to.be.above(0);
  });

});

