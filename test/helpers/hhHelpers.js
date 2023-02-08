const { ethers } = require("hardhat");
const { getResetParams } = require("hardhat.helpers");

const { logBlock } = require("./logHelpers");

const resetFork = async (blockNumber = 14487787) => {
    await network.provider.request({
        method: "hardhat_reset",
        params: [
            {
                forking: getResetParams(blockNumber),
            },
        ],
    });
};

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

module.exports = {
    impersontate,
    mineSomeBlocks,
    resetFork,
};
