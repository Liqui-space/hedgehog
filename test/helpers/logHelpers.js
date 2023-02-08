const { ethers } = require("hardhat");
const { wethAddress, osqthAddress, usdcAddress } = require("@shared/constants");
const { getERC20Balance } = require("./tokenHelpers");

const logBlock = async () => {
    const blockNumBefore = await ethers.provider.getBlockNumber();
    const blockBefore = await ethers.provider.getBlock(blockNumBefore);
    const timestampBefore = blockBefore.timestamp;
    console.log("> blockNumber:", blockNumBefore, "timestamp:", timestampBefore);
};

const logBalance = async (account, label = "", extended = false) => {
    if (typeof account == "object") account = account.address;
    if (extended) console.log(label + " ETH", await ethers.provider.getBalance(account));
    console.log(label + " WETH", await getERC20Balance(account, wethAddress));
    console.log(label + " USDC", await getERC20Balance(account, usdcAddress));
    console.log(label + " oSQTH", await getERC20Balance(account, osqthAddress));
};

const getSnapshot = async (account) => {
    return {
        WETH: await getERC20Balance(account, wethAddress),
        USDC: await getERC20Balance(account, usdcAddress),
        oSQTH: await getERC20Balance(account, osqthAddress),
        ETH: await ethers.provider.getBalance(account.address ? account.address : account),
    };
};

module.exports = {
    logBalance,
    logBlock,
    getSnapshot,
};
