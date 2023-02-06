const { logBlock } = require("../test/helpers");
const { wethAddress, usdcAddress } = require("../test/common/index");
const { getERC20Balance, getUSDC, getWETH } = require("../test/helpers/tokenHelpers");
const { mineSomeBlocks } = require("../test/helpers");
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");
const { utils } = ethers;

const main = async () => {
    const signers = await ethers.getSigners();
    governance = signers[0];

    await init();

    await bigSwap();

    await mineSomeBlocks(43170);
    // await mineSomeBlocks(600); // quicken the process

    while (true) {
        await smallSwaps();
        await delay(3000);
    }
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function between(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

const smallSwaps = async () => {
    if (between(0, 1)) {
        const swapAmount = utils.parseUnits("25000", 6);
        console.log("> Swap %s USDC to ETH", swapAmount.toString() / 1e6);
        const balance = BigNumber.from(await getERC20Balance(v3Helper.address, usdcAddress));
        if (balance.lt(swapAmount)) {
            await getUSDC(swapAmount.sub(balance).toString(), v3Helper.address);
        }

        // State
        console.log("WETH before:", await getERC20Balance(v3Helper.address, wethAddress));
        console.log("USDC before:", await getERC20Balance(v3Helper.address, usdcAddress));

        tx = await v3Helper.connect(governance).swapUSDC_WETH(swapAmount);
        await tx.wait();
    } else {
        const swapAmount = utils.parseUnits("19", 18);
        console.log("> Swap %s ETH to USDC", swapAmount.toString() / 1e18);
        const balance = BigNumber.from(await getERC20Balance(v3Helper.address, wethAddress));
        if (balance.lt(swapAmount)) {
            await getWETH(swapAmount.sub(balance), v3Helper.address);
        }

        // State
        console.log("WETH before:", await getERC20Balance(v3Helper.address, wethAddress));
        console.log("USDC before:", await getERC20Balance(v3Helper.address, usdcAddress));
        tx = await v3Helper.connect(governance).swapWETH_USDC(swapAmount);
        await tx.wait();
    }

    // State
    console.log("WETH:", await getERC20Balance(v3Helper.address, wethAddress));
    console.log("USDC:", await getERC20Balance(v3Helper.address, usdcAddress));

    await logBlock();
};

const bigSwap = async () => {
    const swapAmount = utils.parseUnits("1000", 6).toString();
    console.log("> Swap %s USDC to ETH", swapAmount / 1e6);

    const balance = await getERC20Balance(v3Helper.address, usdcAddress);
    if (balance < swapAmount) {
        await getUSDC(swapAmount - balance, v3Helper.address);
    }

    tx = await v3Helper.connect(governance).swapUSDC_WETH(swapAmount);
    await tx.wait();
};

const init = async () => {
    [Vault, VaultAuction, VaultMath, VaultTreasury, VaultStorage] = [
        "0x325c8Df4CFb5B068675AFF8f62aA668D1dEc3C4B",
        "0x4eaB29997D332A666c3C366217Ab177cF9A7C436",
        "0x5Ffe31E4676D3466268e28a75E51d1eFa4298620",
        "0x627b9A657eac8c3463AD17009a424dFE3FDbd0b1",
        "0xa62835D1A6bf5f521C4e2746E1F51c923b8f3483",
        "0x8ac5eE52F70AE01dB914bE459D8B3d50126fd6aE",
    ];

    Factory = await ethers.getContractFactory("V3Helper");
    v3Helper = await Factory.attach("0xd753c12650c280383Ce873Cc3a898F6f53973d16");

    oneClickDeposit = {
        address: "0xd710a67624Ad831683C86a48291c597adE30F787",
    };
};

main();
