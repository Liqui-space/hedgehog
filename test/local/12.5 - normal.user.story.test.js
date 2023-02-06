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

describe.skip("User story with", function () {
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

        // console.log(await VaultStorage.keeper());
        // console.log(rebalancer.address);
    });

    it("deposit1", async function () {
        const amountWETH = utils.parseUnits("20", 18);
        await getAndApproveWETH(depositor1, amountWETH, oneClickDeposit.address);
        await logBalance(depositor1.address, "> user1 Balance Before Deposit");

        tx = await oneClickDeposit
            .connect(depositor1)
            .deposit(amountWETH, "995000000000000000", depositor1.address, "0");
        await tx.wait();

        await logBalance(depositor1.address, "> user1 Balance After Deposit");
        console.log("> user1 Share After Deposit", await getERC20Balance(depositor1.address, Vault.address));
    });

    it("withdraw1 -> No liquidity", async function () {
        const allShares = await getERC20Balance(depositor1.address, Vault.address);
        tx = await Vault.connect(depositor1).withdraw(BigNumber.from(allShares).div(2), "0", "0", "0");
        await tx.wait();

        await logBalance(depositor1.address, "> user1 Balance After Witdraw");
        console.log("> user1 Share After Witdraw", await getERC20Balance(depositor1.address, Vault.address));
    });

    it("deposit2", async function () {
        const amountWETH = utils.parseUnits("29", 18);
        await getAndApproveWETH(depositor2, amountWETH, oneClickDeposit.address);
        await logBalance(depositor2.address, "> user2 Balance Before Deposit");

        tx = await oneClickDeposit
            .connect(depositor2)
            .deposit(amountWETH, "995000000000000000", depositor2.address, "0");
        await tx.wait();

        await logBalance(depositor2.address, "> user2 Balance After Deposit");
        console.log("> user2 Share After Deposit", await getERC20Balance(depositor2.address, Vault.address));
    });

    it("2 swaps", async function () {
        await mineSomeBlocks(2216);

        swapAmount = utils.parseUnits("100", 18).toString();
        await getWETH(swapAmount, contractHelper.address);
        console.log("> WETH before swap:", await getERC20Balance(contractHelper.address, wethAddress));
        console.log("> USDC before swap:", await getERC20Balance(contractHelper.address, usdcAddress));
        tx = await contractHelper.connect(swaper).swapWETH_USDC(swapAmount);
        await tx.wait();
        console.log("> WETH after swap:", await getERC20Balance(contractHelper.address, wethAddress));
        console.log("> USDC after swap:", await getERC20Balance(contractHelper.address, usdcAddress));

        await mineSomeBlocks(554);

        swapAmount = utils.parseUnits("40", 18).toString();
        await getOSQTH(swapAmount, contractHelper.address, _biggestOSqthHolder);
        console.log("> OSQTH before swap:", await getERC20Balance(contractHelper.address, osqthAddress));
        console.log("> WETH before swap:", await getERC20Balance(contractHelper.address, wethAddress));
        tx = await contractHelper.connect(swaper).swapOSQTH_WETH(swapAmount);
        await tx.wait();
        console.log("> OSQTH before swap:", await getERC20Balance(contractHelper.address, osqthAddress));
        console.log("> WETH before swap:", await getERC20Balance(contractHelper.address, wethAddress));

        await mineSomeBlocks(554);
    });

    it("rebalance", async function () {
        await mineSomeBlocks(83622);
        await logBalance(rebalancer.address, "> Rebalancer Balance Before rebalance");

        tx = await rebalancer.connect(governance).rebalance(0, 0);
        await tx.wait();

        await logBalance(rebalancer.address, "> Rebalancer Balance After rebalance");

        // const amount = await VaultMath.getTotalAmounts();
        // console.log("> Total amounts:", amount);
    });

    it("deposit3 -> cap limit", async function () {
        let succeded = false;
        console.log("> totalSupply:", await Vault.totalSupply());
        try {
            const amountWETH = utils.parseUnits("200", 18);
            await getAndApproveWETH(depositor3, amountWETH, oneClickDeposit.address);
            tx = await oneClickDeposit
                .connect(depositor3)
                .deposit(amountWETH, "950000000000000000", depositor3.address, "0");
            await tx.wait();
        } catch (err) {
            if (err.message == `VM Exception while processing transaction: reverted with reason string 'C4'`)
                succeded = true;
            else console.log(err.message);
        }
        assert(succeded, "Cap was not reached");

        await logBalance(depositor3.address, "> user3 Balance After Deposit");
    });

    it("deposit3", async function () {
        const amountWETH = utils.parseUnits("45", 18);

        await logBalance(depositor3.address, "> user3 Balance Before Deposit");

        tx = await oneClickDeposit
            .connect(depositor3)
            .deposit(amountWETH, "990000000000000000", depositor3.address, "0");
        await tx.wait();
        await logBalance(depositor3.address, "> user3 Balance After Deposit");
        console.log("> user3 Share After Deposit", await getERC20Balance(depositor3.address, Vault.address));
    });

    it("withdraw2", async function () {
        await logBalance(depositor2.address, "> user2 Balance Before Witdraw");
        console.log("> user2 Share Before Witdraw", await getERC20Balance(depositor2.address, Vault.address));

        const allShares = await getERC20Balance(depositor2.address, Vault.address);
        tx = await Vault.connect(depositor2).withdraw(BigNumber.from(allShares), "0", "0", "0");
        await tx.wait();

        await logBalance(depositor2.address, "> user2 Balance After Witdraw");
        console.log("> user2 Share After Witdraw", await getERC20Balance(depositor2.address, Vault.address));
    });

    it("swap", async function () {
        await mineSomeBlocks(2216);

        swapAmount = utils.parseUnits("1000000", 6).toString();
        await getUSDC(swapAmount, contractHelper.address);
        console.log("> WETH before swap:", await getERC20Balance(contractHelper.address, wethAddress));
        console.log("> USDC before swap:", await getERC20Balance(contractHelper.address, usdcAddress));
        tx = await contractHelper.connect(swaper).swapUSDC_WETH(swapAmount);
        await tx.wait();
        console.log("> WETH after swap:", await getERC20Balance(contractHelper.address, wethAddress));
        console.log("> USDC after swap:", await getERC20Balance(contractHelper.address, usdcAddress));

        await mineSomeBlocks(554);

        swapAmount = utils.parseUnits("100", 18).toString();
        await getWETH(swapAmount, contractHelper.address);
        console.log("> OSQTH before swap:", await getERC20Balance(contractHelper.address, osqthAddress));
        console.log("> WETH before swap:", await getERC20Balance(contractHelper.address, wethAddress));
        tx = await contractHelper.connect(swaper).swapWETH_OSQTH(swapAmount);
        await tx.wait();
        console.log("> OSQTH before swap:", await getERC20Balance(contractHelper.address, osqthAddress));
        console.log("> WETH before swap:", await getERC20Balance(contractHelper.address, wethAddress));

        await mineSomeBlocks(554);
    });

    it("rebalance2", async function () {
        await mineSomeBlocks(83622);
        await logBalance(rebalancer.address, "> Rebalancer Balance Before rebalance");

        tx = await rebalancer.connect(governance).rebalance(0, 0);
        await tx.wait();

        await logBalance(rebalancer.address, "> Rebalancer Balance After rebalance");
    });

    it("withdraw1", async function () {
        await logBalance(depositor1.address, "> user1 Balance Before Witdraw");
        console.log("> user1 Share Before Witdraw", await getERC20Balance(depositor1.address, Vault.address));

        const allShares = await getERC20Balance(depositor1.address, Vault.address);
        tx = await Vault.connect(depositor1).withdraw(BigNumber.from(allShares), "0", "0", "0");
        await tx.wait();

        await logBalance(depositor1.address, "> user1 Balance After Witdraw");
        console.log("> user1 Share After Witdraw", await getERC20Balance(depositor1.address, Vault.address));
    });

    it("swap", async function () {
        await mineSomeBlocks(2216);

        //  swapAmount = utils.parseUnits("40000", 18).toString();
        //  await getWETH(swapAmount, contractHelper.address, "0x06920c9fc643de77b99cb7670a944ad31eaaa260");
        //  tx = await contractHelper.connect(swaper).swapWETH_USDC(swapAmount);
        //  await tx.wait();

        //  swapAmount = utils.parseUnits("1700", 18).toString();
        //  await getOSQTH(swapAmount, contractHelper.address, _biggestOSqthHolder);
        //  console.log("> OSQTH before swap:", await getERC20Balance(contractHelper.address, osqthAddress));
        //  console.log("> WETH before swap:", await getERC20Balance(contractHelper.address, wethAddress));
        //  tx = await contractHelper.connect(swaper).swapOSQTH_WETH(swapAmount);
        //  await tx.wait();

        swapAmount = utils.parseUnits("33000000", 6).toString();
        await getUSDC(swapAmount, contractHelper.address, "0xf885bdd59e5652fe4940ca6b8c6ebb88e85a5a40");
        console.log("> WETH before swap:", await getERC20Balance(contractHelper.address, wethAddress));
        console.log("> USDC before swap:", await getERC20Balance(contractHelper.address, usdcAddress));
        tx = await contractHelper.connect(swaper).swapUSDC_WETH(swapAmount);
        await tx.wait();

        await logBlock();

        swapAmount = utils.parseUnits("1500", 18).toString();
        await getWETH(swapAmount, contractHelper.address);
        console.log("> OSQTH before swap:", await getERC20Balance(contractHelper.address, osqthAddress));
        console.log("> WETH before swap:", await getERC20Balance(contractHelper.address, wethAddress));
        tx = await contractHelper.connect(swaper).swapWETH_OSQTH(swapAmount);
        await tx.wait();
    });

    it("price rebalance", async function () {
        await mineSomeBlocks(200);
        await logBlock();
        await logBalance(governance.address, "> Governance Balance Before price rebalance");
        await mineSomeBlocks(1250);

        tx = await rebalancer.connect(governance).rebalance(0, 1663937523);
        await tx.wait();

        await logBalance(governance.address, "> Governance Balance After price rebalance");
    });

    return;
    it("withdraw3", async function () {
        await logBalance(depositor3.address, "> user3 Balance Before Witdraw");
        console.log("> user3 Share Before Witdraw", await getERC20Balance(depositor3.address, Vault.address));

        const allShares = await getERC20Balance(depositor3.address, Vault.address);
        tx = await Vault.connect(depositor3).withdraw(BigNumber.from(allShares), "0", "0", "0");
        await tx.wait();

        await logBalance(depositor3.address, "> user3 Balance After Witdraw");
        console.log("> user3 Share After Witdraw", await getERC20Balance(depositor3.address, Vault.address));
    });
});
