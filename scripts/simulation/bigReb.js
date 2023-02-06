const { resetFork, logBlock } = require("../../test/helpers");
const { wethAddress, usdcAddress, osqthAddress } = require("../shared/constants");
const { hardhatDeploy, deploymentParams } = require("../../test/deploy/index");
const { getERC20Balance, getUSDC, getWETH, approveERC20 } = require("../../test/helpers/tokenHelpers");
const { mineSomeBlocks } = require("../../test/helpers");
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");
const { utils } = ethers;

const main = async () => {
    const signers = await ethers.getSigners();
    governance = signers[0];
    depositor = signers[13];

    let initBlock = 15574801;
    await resetFork(initBlock);
    console.log("initialized:");
    await logBlock();

    await init();
    console.log("deployed:");
    await logBlock();
    await network.provider.send("evm_setAutomine", [true]);

    await deposit();

    await bigSwap();

    await mineSomeBlocks(43170);

    await mineSomeBlocks(600); // quicken the process

    while (true) {
        await smallSwaps();
        await delay(3000);
    }
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function between(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

const deposit = async () => {
    const ethToDeposit = utils.parseUnits("1", 18);

    await getWETH(ethToDeposit.toString(), depositor.address);

    await approveERC20(depositor, oneClickDeposit.address, ethToDeposit, wethAddress);

    tx = await oneClickDeposit
        .connect(depositor)
        .deposit(ethToDeposit, utils.parseUnits("99", 16), depositor.address, "0");
    await tx.wait();

    console.log(">> Deposited %s WETH", ethToDeposit / 1e18);
};

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
    const swapAmount = utils.parseUnits("10000000", 6).toString();
    console.log("> Swap %s USDC to ETH", swapAmount / 1e6);

    const balance = await getERC20Balance(v3Helper.address, usdcAddress);
    if (balance < swapAmount) {
        await getUSDC(swapAmount - balance, v3Helper.address);
    }

    tx = await v3Helper.connect(governance).swapUSDC_WETH(swapAmount);
    await tx.wait();
};

const init = async () => {
    const params = [...deploymentParams];
    [Vault, VaultAuction, VaultMath, VaultTreasury, VaultStorage] = await hardhatDeploy(
        governance,
        params,
        "0x06b3244b086cecC40F1e5A826f736Ded68068a0F"
    );

    Factory = await ethers.getContractFactory("V3Helper");
    v3Helper = await Factory.deploy();
    await v3Helper.deployed();

    console.log("v3Helper", v3Helper.address);

    Factory = await ethers.getContractFactory("OneClickDeposit");
    oneClickDeposit = await Factory.deploy();
    await oneClickDeposit.deployed();

    console.log("oneClickDeposit", oneClickDeposit.address);

    tx = await oneClickDeposit.setContracts(Vault.address);
    await tx.wait();

    Factory = await ethers.getContractFactory("BigRebalancer");
    rebalancer = await Factory.deploy();
    await rebalancer.deployed();

    console.log("rebalancer", rebalancer.address);
    console.log("rebalancer owner", await rebalancer.owner());

    tx = await rebalancer.setContracts(VaultAuction.address, VaultMath.address, VaultTreasury.address);
    await tx.wait();

    // await logState(Vault.address);
    // await logState(VaultAuction.address);
    // await logState(VaultMath.address);
    // await logState(VaultTreasury.address);
    // await logState(VaultStorage.address);
    // await logState(v3Helper.address);
    // await logState(oneClickDeposit.address);
    // await logState(rebalancer.address);
};

const logState = async (address) => {
    console.log(await getERC20Balance(address, wethAddress));
    console.log(await getERC20Balance(address, usdcAddress));
    console.log(await getERC20Balance(address, osqthAddress));
};

main();
