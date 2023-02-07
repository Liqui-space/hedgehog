const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const { utils } = ethers;
const {
    wethAddress,
    osqthAddress,
    usdcAddress,
    _governanceAddress,
    _vaultAddress,
    maxUint256,
} = require("@shared/constants");
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
const { hardhatInitializedDeploy } = require("@shared/deploy");
const { BigNumber } = require("ethers");

describe.skip("Simple Deposit Mainnet", function () {
    let governance;
    let governanceAddress = _governanceAddress;
    it("Should set actors", async function () {
        await resetFork(15333510);
        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [governanceAddress],
        });

        governance = await ethers.getSigner(governanceAddress);
        console.log("governance:", governance.address);
    });

    it("deposit", async function () {
        let MyContract = await ethers.getContractFactory("Vault");
        const Vault = await MyContract.attach(_vaultAddress);
        let tx;

        let tS = (await Vault.totalSupply()).toString();

        let eth = utils.parseUnits("0.005", 18);
        let usdc = utils.parseUnits("4.6", 6);
        let sqth = utils.parseUnits("0.026", 18);

        let data = await Vault.connect(governance).calcSharesAndAmounts(eth, usdc, sqth, tS, false);
        console.log(data);

        console.log(eth.toString());
        console.log(data[1].toString());
        console.log(usdc.toString());
        console.log(data[2].toString());
        console.log(sqth.toString());
        console.log(data[3].toString());

        let WETH = await ethers.getContractAt("IWETH", wethAddress);
        let USDC = await ethers.getContractAt("IWETH", usdcAddress);
        let OSQTH = await ethers.getContractAt("IWETH", osqthAddress);
        const maxApproval = BigNumber.from(maxUint256);

        console.log("> userEth %s", await getERC20Balance(governance.address, wethAddress));
        console.log("> userUsdc %s", await getERC20Balance(governance.address, usdcAddress));
        console.log("> userOsqth %s", await getERC20Balance(governance.address, osqthAddress));

        tx = await WETH.connect(governance).approve(_vaultAddress, maxApproval);
        await tx.wait();
        tx = await USDC.connect(governance).approve(_vaultAddress, maxApproval);
        await tx.wait();
        tx = await OSQTH.connect(governance).approve(_vaultAddress, maxApproval);
        await tx.wait();

        let to = governanceAddress;

        tx = await Vault.connect(governance).deposit(eth, usdc, sqth, to, 0, 0, 0);
        receipt = await tx.wait();
        console.log("> Gas used:", receipt.gasUsed.toString());

        console.log("> userEth %s", await getERC20Balance(governance.address, wethAddress));
        console.log("> userUsdc %s", await getERC20Balance(governance.address, usdcAddress));
        console.log("> userOsqth %s", await getERC20Balance(governance.address, osqthAddress));
    });
});
