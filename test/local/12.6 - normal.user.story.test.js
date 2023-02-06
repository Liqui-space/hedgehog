const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const { utils } = ethers;
const { wethAddress, osqthAddress, usdcAddress, _biggestOSqthHolder } = require("@shared/constants");
const {
    mineSomeBlocks,
    resetFork,
    logBlock,
    getAndApprove2,
    getERC20Balance,
    getWETH,
    getOSQTH,
    getUSDC,
    approveERC20,
    logBalance,
} = require("../helpers");
const { hardhatDeploy, deploymentParams } = require("@shared/deploy");
const { BigNumber } = require("ethers");

describe.skip("User story with 5 swaps", function () {
    const getAndApproveWETH = async (owner, amount, toAddress) => {
        await getWETH(amount, owner.address, "0x06920c9fc643de77b99cb7670a944ad31eaaa260");
        await approveERC20(owner, toAddress, amount, wethAddress);
    };

    let swaper, depositor1, depositor2, depositor3, keeper, governance, swapAmount;
    it("Should set actors", async function () {
        const signers = await ethers.getSigners();
        governance = signers[0];
        depositor1 = signers[9];
        keeper = signers[10];
        swaper = signers[11];
        depositor2 = signers[12];
        depositor3 = signers[13];
        depositor4 = signers[14];
        depositor5 = signers[15];
    });

    let Vault, VaultAuction, VaultMath, VaultTreasury, VaultStorage, tx;
    it("Should deploy contract", async function () {
        await resetFork(15581574);

        const params = [...deploymentParams];
        params[6] = "0";
        [Vault, VaultAuction, VaultMath, VaultTreasury, VaultStorage] = await hardhatDeploy(governance, params);

        const ContractHelper = await ethers.getContractFactory("V3Helper");
        contractHelper = await ContractHelper.deploy();
        await contractHelper.deployed();

        Factory = await ethers.getContractFactory("OneClickDeposit");
        oneClickDeposit = await Factory.deploy();
        await oneClickDeposit.deployed();

        tx = await oneClickDeposit.setContracts(Vault.address);
        await tx.wait();

        const Rebalancer = await ethers.getContractFactory("BigRebalancer");
        rebalancer = await Rebalancer.deploy();
        await rebalancer.deployed();

        tx = await rebalancer.setContracts(
            "0x5Ffe31E4676D3466268e28a75E51d1eFa4298620",
            "0x627b9A657eac8c3463AD17009a424dFE3FDbd0b1",
            "0xa62835D1A6bf5f521C4e2746E1F51c923b8f3483"
        );
        await tx.wait();

        tx = await VaultStorage.setKeeper(rebalancer.address);
        await tx.wait();
    });

    it("deposit1", async function () {
        const amountWETH = utils.parseUnits("1", 18);
        await getAndApproveWETH(depositor1, amountWETH, oneClickDeposit.address);
        await logBalance(depositor1.address, "> user1 Balance Before Deposit");

        tx = await oneClickDeposit
            .connect(depositor1)
            .deposit(amountWETH, "995000000000000000", depositor1.address, "0");
        await tx.wait();

        await logBalance(depositor1.address, "> user1 Balance After Deposit");
        console.log("> user1 Share After Deposit", await getERC20Balance(depositor1.address, Vault.address));
    });

    it("2 swaps", async function () {
        await mineSomeBlocks(2216);

        swapAmount = utils.parseUnits("100", 18).toString();
        await getWETH(swapAmount, contractHelper.address);
        tx = await contractHelper.connect(swaper).swapWETH_USDC(swapAmount);
        await tx.wait();

        await mineSomeBlocks(554);

        swapAmount = utils.parseUnits("30", 18).toString();
        await getOSQTH(swapAmount, contractHelper.address, _biggestOSqthHolder);
        tx = await contractHelper.connect(swaper).swapOSQTH_WETH(swapAmount);
        await tx.wait();

        await mineSomeBlocks(554);
    });

    it("rebalance1", async function () {
        await mineSomeBlocks(83622);
        await logBalance(rebalancer.address, "> Rebalancer Balance Before rebalance");

        tx = await rebalancer.connect(governance).rebalance(0, 0);
        await tx.wait();

        await logBalance(rebalancer.address, "> Rebalancer Balance After rebalance");
    });

    it("deposit2", async function () {
        const amountWETH = utils.parseUnits("1", 18);
        await getAndApproveWETH(depositor2, amountWETH, oneClickDeposit.address);
        await logBalance(depositor2.address, "> user2 Balance Before Deposit");

        tx = await oneClickDeposit
            .connect(depositor2)
            .deposit(amountWETH, "995000000000000000", depositor2.address, "0");
        await tx.wait();

        await logBalance(depositor2.address, "> user2 Balance After Deposit");
        console.log("> user2 Share After Deposit", await getERC20Balance(depositor2.address, Vault.address));
    });

    // it("2 swaps", async function () {
    //     await mineSomeBlocks(2216);

    //     swapAmount = utils.parseUnits("10000", 18).toString();
    //     await getWETH(swapAmount, contractHelper.address);
    //     tx = await contractHelper.connect(swaper).swapWETH_USDC(swapAmount);
    //     await tx.wait();

    //     await mineSomeBlocks(554);

    //     swapAmount = utils.parseUnits("30", 18).toString();
    //     await getOSQTH(swapAmount, contractHelper.address, _biggestOSqthHolder);
    //     tx = await contractHelper.connect(swaper).swapOSQTH_WETH(swapAmount);
    //     await tx.wait();

    //     await mineSomeBlocks(554);
    // });

    it("deposit3", async function () {
        const amountWETH = utils.parseUnits("1", 18);
        await getAndApproveWETH(depositor3, amountWETH, oneClickDeposit.address);
        await logBalance(depositor3.address, "> user3 Balance Before Deposit");

        tx = await oneClickDeposit
            .connect(depositor3)
            .deposit(amountWETH, "999000000000000000", depositor3.address, "0");
        await tx.wait();

        await logBalance(depositor3.address, "> user3 Balance After Deposit");
        console.log("> user3 Share After Deposit", await getERC20Balance(depositor3.address, Vault.address));
    });

    it("2 swaps", async function () {
        await mineSomeBlocks(2216);

        swapAmount = utils.parseUnits("100", 18).toString();
        await getWETH(swapAmount, contractHelper.address);
        tx = await contractHelper.connect(swaper).swapWETH_USDC(swapAmount);
        await tx.wait();

        await mineSomeBlocks(554);

        swapAmount = utils.parseUnits("30", 18).toString();
        await getOSQTH(swapAmount, contractHelper.address, _biggestOSqthHolder);
        tx = await contractHelper.connect(swaper).swapOSQTH_WETH(swapAmount);
        await tx.wait();

        await mineSomeBlocks(554);
    });

    it("deposit4", async function () {
        const amountWETH = utils.parseUnits("1", 18);
        await getAndApproveWETH(depositor4, amountWETH, oneClickDeposit.address);
        await logBalance(depositor4.address, "> user4 Balance Before Deposit");
        console.log("> user4 Share Before Deposit", await getERC20Balance(depositor4.address, Vault.address));

        tx = await oneClickDeposit
            .connect(depositor4)
            .deposit(amountWETH, "995000000000000000", depositor4.address, "0");
        await tx.wait();

        await logBalance(depositor4.address, "> user4 Balance After Deposit");
        console.log("> user4 Share After Deposit", await getERC20Balance(depositor4.address, Vault.address));
    });

    it("2 swaps", async function () {
        await mineSomeBlocks(2216);

        swapAmount = utils.parseUnits("100", 18).toString();
        await getWETH(swapAmount, contractHelper.address);
        tx = await contractHelper.connect(swaper).swapWETH_USDC(swapAmount);
        await tx.wait();

        await mineSomeBlocks(554);

        swapAmount = utils.parseUnits("30", 18).toString();
        await getOSQTH(swapAmount, contractHelper.address, _biggestOSqthHolder);
        tx = await contractHelper.connect(swaper).swapOSQTH_WETH(swapAmount);
        await tx.wait();

        await mineSomeBlocks(554);
    });

    it("deposit5", async function () {
        const amountWETH = utils.parseUnits("1", 18);
        await getAndApproveWETH(depositor5, amountWETH, oneClickDeposit.address);
        await logBalance(depositor5.address, "> user5 Balance Before Deposit");

        tx = await oneClickDeposit
            .connect(depositor5)
            .deposit(amountWETH, "995000000000000000", depositor5.address, "0");
        await tx.wait();

        await logBalance(depositor5.address, "> user5 Balance After Deposit");
        console.log("> user5 Share After Deposit", await getERC20Balance(depositor5.address, Vault.address));
    });

    it("2 swaps", async function () {
        await mineSomeBlocks(2216);

        swapAmount = utils.parseUnits("100", 18).toString();
        await getWETH(swapAmount, contractHelper.address);
        tx = await contractHelper.connect(swaper).swapWETH_USDC(swapAmount);
        await tx.wait();

        await mineSomeBlocks(554);

        swapAmount = utils.parseUnits("30", 18).toString();
        await getOSQTH(swapAmount, contractHelper.address, _biggestOSqthHolder);
        tx = await contractHelper.connect(swaper).swapOSQTH_WETH(swapAmount);
        await tx.wait();

        await mineSomeBlocks(554);
    });

    it("withdraw1", async function () {
        await logBalance(depositor1.address, "> userq Balance Before Witdraw");
        const allShares = await getERC20Balance(depositor1.address, Vault.address);
        console.log("> userq Share Before Witdraw", allShares);

        tx = await Vault.connect(depositor1).withdraw(BigNumber.from(allShares), "0", "0", "0");
        await tx.wait();

        await logBalance(depositor1.address, "> user1 Balance After Witdraw");
        console.log("> user1 Share After Witdraw", await getERC20Balance(depositor1.address, Vault.address));
    });

    it("withdraw2", async function () {
        await logBalance(depositor2.address, "> userq Balance Before Witdraw");
        const allShares = await getERC20Balance(depositor2.address, Vault.address);
        console.log("> userq Share Before Witdraw", allShares);

        tx = await Vault.connect(depositor2).withdraw(BigNumber.from(allShares), "0", "0", "0");
        await tx.wait();

        await logBalance(depositor2.address, "> user2 Balance After Witdraw");
        console.log("> user2 Share After Witdraw", await getERC20Balance(depositor2.address, Vault.address));
    });

    it("withdraw3", async function () {
        await logBalance(depositor3.address, "> userq Balance Before Witdraw");
        const allShares = await getERC20Balance(depositor3.address, Vault.address);
        console.log("> userq Share Before Witdraw", allShares);

        tx = await Vault.connect(depositor3).withdraw(BigNumber.from(allShares), "0", "0", "0");
        await tx.wait();

        await logBalance(depositor3.address, "> user3 Balance After Witdraw");
        console.log("> user3 Share After Witdraw", await getERC20Balance(depositor3.address, Vault.address));
    });

    it("withdraw4", async function () {
        await logBalance(depositor4.address, "> userq Balance Before Witdraw");
        const allShares = await getERC20Balance(depositor4.address, Vault.address);
        console.log("> userq Share Before Witdraw", allShares);

        tx = await Vault.connect(depositor4).withdraw(BigNumber.from(allShares), "0", "0", "0");
        await tx.wait();

        await logBalance(depositor4.address, "> user4 Balance After Witdraw");
        console.log("> user4 Share After Witdraw", await getERC20Balance(depositor4.address, Vault.address));
    });

    it("withdraw5", async function () {
        await logBalance(depositor5.address, "> userq Balance Before Witdraw");
        const allShares = await getERC20Balance(depositor5.address, Vault.address);
        console.log("> userq Share Before Witdraw", allShares);

        tx = await Vault.connect(depositor5).withdraw(BigNumber.from(allShares), "0", "0", "0");
        await tx.wait();

        await logBalance(depositor5.address, "> user5 Balance After Witdraw");
        console.log("> user5 Share After Witdraw", await getERC20Balance(depositor5.address, Vault.address));

        await logBalance(VaultTreasury.address, "balances after %s");
    });

    // it("rebalance2", async function () {
    //     await mineSomeBlocks(83622);
    //     await logBalance(rebalancer.address, "> Rebalancer Balance Before rebalance");

    //     console.log(await rebalancer.connect(governance).isQuickRebalance());
    //     tx = await rebalancer.connect(governance).rebalance(0, 0);
    //     await tx.wait();

    //     await logBalance(rebalancer.address, "> Rebalancer Balance After rebalance");
    // });

    return;
});
