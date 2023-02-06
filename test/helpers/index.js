const { ethers } = require("hardhat");
const {
    getAndApprove,
    approveERC20,
    getERC20Allowance,
} = require("./approveERC20");

const {
    getETH,
    getOSQTH,
    getUSDC,
    getWETH,
    getERC20Balance,
} = require("./getERC20");

const {loadTestDataset, assertWP, resetFork, logBlock, logBalance } = require("./testHelpers");

const mineSomeBlocks = async (blocksToMine) => {
    await logBlock();
    await hre.network.provider.send("hardhat_mine", [`0x${blocksToMine.toString(16)}`]);
    console.log(`> ${blocksToMine} blocks was mine`);
    await logBlock();
};

const impersontate = async (account) => {
    await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [account],
    });
    return await ethers.getSigner(account);
};

const getSnapshot = async (account) => {
    return {
        WETH: await getERC20Balance(account, wethAddress),
        USDC: await getERC20Balance(account, usdcAddress),
        oSQTH: await getERC20Balance(account, osqthAddress),
        ETH: await ethers.provider.getBalance(account.address ? account.address : account),
    };
};

const toHexdigital = (amount) => {
    return "0x" + amount.toString(16);
};


module.exports = {
    impersontate,
    getETH,
    getSnapshot,
    mineSomeBlocks,
    logBalance,
    logBlock,
    getAndApprove,
    resetFork,
    assertWP,
    getOSQTH,
    approveERC20,
    getUSDC,
    getWETH,
    toHexdigital,
    getERC20Allowance,
    loadTestDataset,
    getERC20Balance,
};
