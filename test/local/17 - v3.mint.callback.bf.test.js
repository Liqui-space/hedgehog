const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const { utils } = ethers;
const { wethAddress, osqthAddress, usdcAddress } = require("@shared/constants");
const {
    mineSomeBlocks,
    resetFork,
    logBlock,
    getAndApprove2,
    getERC20Balance,
    getWETH,
    getOSQTH,
    getUSDC,
} = require("../helpers");
const { hardhatInitializeDeploy, deploymentParams, hardhatDeploy } = require("@shared/deploy");
const { BigNumber } = require("ethers");
const abi = ethers.utils.defaultAbiCoder;

describe.skip("V3 mint callback check bf", function () {
    it("1 test", async function () {
        this.skip();
        await resetFork(15278550);

        let MyContract = await ethers.getContractFactory("Rebalancer");
        const rebalancer = await MyContract.attach(_rebalancerAddress);

        console.log("> userEth %s", await getERC20Balance(rebalancer.address, wethAddress));
        console.log("> userUsdc %s", await getERC20Balance(rebalancer.address, usdcAddress));
        console.log("> userOsqth %s", await getERC20Balance(rebalancer.address, osqthAddress));

        await resetFork(15278554);

        console.log("> userEth %s", await getERC20Balance(rebalancer.address, wethAddress));
        console.log("> userUsdc %s", await getERC20Balance(rebalancer.address, usdcAddress));
        console.log("> userOsqth %s", await getERC20Balance(rebalancer.address, osqthAddress));

        console.log(0.000023504084671461 * 1600);
    });

    it("unuthorized test", async function () {
        this.skip();
        await resetFork(15278541);

        [Vault, VaultAuction, VaultMath, VaultTreasury, VaultStorage] = await hardhatInitializeDeploy();
        const signers = await ethers.getSigners();
        unuthorized = signers[12];

        const arr = abi.encode(["address", "address", "address"], [unuthorized.address, wethAddress, usdcAddress]);
        tx = await VaultTreasury.connect(unuthorized).uniswapV3MintCallback(1, 1, arr);
        await tx.wait();

        console.log("> unuthorized ETH %s", await getERC20Balance(unuthorized.address, wethAddress));
        console.log("> unuthorized USDC %s", await getERC20Balance(unuthorized.address, usdcAddress));
        console.log("> unuthorized oSQTH %s", await getERC20Balance(unuthorized.address, osqthAddress));
    });

    let unuthorized, governance;
    it("Should deploy contract", async function () {
        // this.skip();
        const signers = await ethers.getSigners();
        governance = signers[0];
        unuthorized = signers[12];
        await resetFork(15173789);

        const params = [...deploymentParams];
        deploymentParams[6] = "10000";
        [Vault, VaultAuction, VaultMath, VaultTreasury, VaultStorage] = await hardhatDeploy(governance, params);
    });

    it("Should deploy contract", async function () {
        // this.skip();
        console.log(unuthorized.address);
        const arr = abi.encode(["address", "address"], [wethAddress, usdcAddress]);
        tx = await VaultTreasury.connect(unuthorized).uniswapV3MintCallback(1, 1, arr);
        await tx.wait();
    });
});
