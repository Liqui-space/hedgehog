const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const { utils } = ethers;
const { wethAddress, osqthAddress, usdcAddress, _biggestOSqthHolder } = require("@shared/constants");
const {
    mineSomeBlocks,
    resetFork,
    logBlock,
    getAndApprove,
    getERC20Balance,
    getWETH,
    getOSQTH,
    getUSDC,
    approveERC20,
    logBalance,
} = require("../helpers");
const { depositOCComponent } = require("../helpers/components");

const { hardhatDeploy, deploymentParams, hardhatGetPerepherals } = require("@shared/deploy");
const { BigNumber } = require("ethers");

describe.only("General Workflow", function () {
    it("Should set actors", async function () {
        [owner, governance, rebalancer, depositor1, keeper, swaper, depositor2, depositor3] = await ethers.getSigners();
    });

    let Vault, VaultAuction, VaultMath, VaultTreasury, VaultStorage, tx;
    it("Should deploy contract", async function () {
        await resetFork(16586904);

        const params = [...deploymentParams];
        params[6] = "0";
        [Vault, VaultAuction, VaultMath, VaultTreasury, VaultStorage] = await hardhatDeploy(
            governance.address,
            params,
            keeper.address
        );

        [V3Helper, OneClickDeposit, OneClickWithdraw, Rebalancer, , , RebalanceModule3] = await hardhatGetPerepherals(
            Vault.address,
            governance,
            keeper,
            rebalancer,
            VaultStorage
        );

        tx = await Rebalancer.connect(rebalancer).setKeeper(keeper.address);
        await tx.wait();
    });

    it("deposit1", async function () {
        await depositOCComponent("20", depositor1, Vault, OneClickDeposit, "depositor1");
    });

    // return;
    // it("withdraw1 -> No liquidity", async function () {
    //     const allShares = await getERC20Balance(depositor1.address, Vault.address);
    //     tx = await Vault.connect(depositor1).withdraw(BigNumber.from(allShares).div(2), "0", "0", "0");
    //     await tx.wait();

    //     await logBalance(depositor1.address, "> user1 Balance After Witdraw");
    //     console.log("> user1 Share After Witdraw", await getERC20Balance(depositor1.address, Vault.address));
    // });

    // it("deposit2", async function () {
    //     const amountWETH = utils.parseUnits("29", 18);
    //     await getAndApproveWETH(depositor2, amountWETH, oneClickDeposit.address);
    //     await logBalance(depositor2.address, "> user2 Balance Before Deposit");

    //     tx = await oneClickDeposit
    //         .connect(depositor2)
    //         .deposit(amountWETH, "995000000000000000", depositor2.address, "0");
    //     await tx.wait();

    //     await logBalance(depositor2.address, "> user2 Balance After Deposit");
    //     console.log("> user2 Share After Deposit", await getERC20Balance(depositor2.address, Vault.address));
    // });

    // return;
    it("2 swaps", async function () {
        await mineSomeBlocks(6000);

        swapAmount = utils.parseUnits("100", 18).toString();
        await getWETH(swapAmount, V3Helper.address);

        tx = await V3Helper.connect(swaper).swapWETH_USDC(swapAmount);
        await tx.wait();

        await mineSomeBlocks(200);

        swapAmount = utils.parseUnits("40", 18).toString();
        await getOSQTH(swapAmount, V3Helper.address);
        tx = await V3Helper.connect(swaper).swapOSQTH_WETH(swapAmount);
        await tx.wait();

        await mineSomeBlocks(81000);
    });

    it("rebalance", async function () {
        await getAndApprove(
            keeper,
            VaultAuction.address,
            utils.parseUnits("10", 18),
            utils.parseUnits("10000", 6),
            utils.parseUnits("4", 18)
        );

        await logBalance(keeper.address, "> keeper before rebalance");

        tx = await VaultAuction.connect(keeper).timeRebalance(keeper.address, 0, 0, 0);
        receipt = await tx.wait();

        await logBalance(keeper.address, "> keeper after rebalance");
    });

    // it("rebalance", async function () {
    //     await mineSomeBlocks(83622);
    //     await logBalance(rebalancer.address, "> Rebalancer Balance Before rebalance");

    //     console.log((await VaultStorage.keeper()) == Rebalancer.address);
    //     tx = await Rebalancer.connect(rebalancer).rebalanceClassic(RebalanceModule3.address, 0);
    //     await tx.wait();

    //     await logBalance(rebalancer.address, "> Rebalancer Balance After rebalance");
    //     // console.log("> Total amounts:", amount);
    // });

    return;
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
        await getUSDC(swapAmount, V3Helper.address);
        console.log("> WETH before swap:", await getERC20Balance(V3Helper.address, wethAddress));
        console.log("> USDC before swap:", await getERC20Balance(V3Helper.address, usdcAddress));
        tx = await V3Helper.connect(swaper).swapUSDC_WETH(swapAmount);
        await tx.wait();
        console.log("> WETH after swap:", await getERC20Balance(V3Helper.address, wethAddress));
        console.log("> USDC after swap:", await getERC20Balance(V3Helper.address, usdcAddress));

        await mineSomeBlocks(554);

        swapAmount = utils.parseUnits("100", 18).toString();
        await getWETH(swapAmount, V3Helper.address);
        console.log("> OSQTH before swap:", await getERC20Balance(V3Helper.address, osqthAddress));
        console.log("> WETH before swap:", await getERC20Balance(V3Helper.address, wethAddress));
        tx = await V3Helper.connect(swaper).swapWETH_OSQTH(swapAmount);
        await tx.wait();
        console.log("> OSQTH before swap:", await getERC20Balance(V3Helper.address, osqthAddress));
        console.log("> WETH before swap:", await getERC20Balance(V3Helper.address, wethAddress));

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
        //  await getWETH(swapAmount, V3Helper.address, "0x06920c9fc643de77b99cb7670a944ad31eaaa260");
        //  tx = await V3Helper.connect(swaper).swapWETH_USDC(swapAmount);
        //  await tx.wait();

        //  swapAmount = utils.parseUnits("1700", 18).toString();
        //  await getOSQTH(swapAmount, V3Helper.address, _biggestOSqthHolder);
        //  console.log("> OSQTH before swap:", await getERC20Balance(V3Helper.address, osqthAddress));
        //  console.log("> WETH before swap:", await getERC20Balance(V3Helper.address, wethAddress));
        //  tx = await V3Helper.connect(swaper).swapOSQTH_WETH(swapAmount);
        //  await tx.wait();

        swapAmount = utils.parseUnits("33000000", 6).toString();
        await getUSDC(swapAmount, V3Helper.address, "0xf885bdd59e5652fe4940ca6b8c6ebb88e85a5a40");
        console.log("> WETH before swap:", await getERC20Balance(V3Helper.address, wethAddress));
        console.log("> USDC before swap:", await getERC20Balance(V3Helper.address, usdcAddress));
        tx = await V3Helper.connect(swaper).swapUSDC_WETH(swapAmount);
        await tx.wait();

        await logBlock();

        swapAmount = utils.parseUnits("1500", 18).toString();
        await getWETH(swapAmount, V3Helper.address);
        console.log("> OSQTH before swap:", await getERC20Balance(V3Helper.address, osqthAddress));
        console.log("> WETH before swap:", await getERC20Balance(V3Helper.address, wethAddress));
        tx = await V3Helper.connect(swaper).swapWETH_OSQTH(swapAmount);
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

    it("withdraw3", async function () {
        await logBalance(depositor3.address, "> user3 Balance Before Witdraw");
        console.log("> user3 Share Before Witdraw", await getERC20Balance(depositor3.address, Vault.address));

        const allShares = await getERC20Balance(depositor3.address, Vault.address);
        tx = await Vault.connect(depositor3).withdraw(BigNumber.from(allShares), "0", "0", "0");
        await tx.wait();

        await logBalance(depositor3.address, "> user3 Balance After Witdraw");
        console.log("> user3 Share After Witdraw", await getERC20Balance(depositor3.address, Vault.address));
    });

    it("feees time! 😝 only half", async function () {
        // State
        const governanceEthBalanceBefore = await getERC20Balance(governance.address, wethAddress);
        const governanceUsdcBalanceBefore = await getERC20Balance(governance.address, usdcAddress);
        const governanceOsqthBalanceBefore = await getERC20Balance(governance.address, osqthAddress);
        console.log("> governanceEthBalanceBefore %s", governanceEthBalanceBefore);
        console.log("> governanceUsdcBalanceBefore %s", governanceUsdcBalanceBefore);
        console.log("> governanceOsqthBalanceBefore %s", governanceOsqthBalanceBefore);

        const fee0 = await VaultStorage.connect(governance).accruedFeesEth();
        const fee1 = await VaultStorage.connect(governance).accruedFeesUsdc();
        const fee2 = await VaultStorage.connect(governance).accruedFeesOsqth();
        console.log("Fees:", fee0.toString(), fee1.toString(), fee2.toString());

        tx = await Vault.connect(governance).collectProtocol(
            fee0.div(BigNumber.from(2)).toString(),
            fee1.div(BigNumber.from(2)).toString(),
            fee2.div(BigNumber.from(2)).toString(),
            governance.address
        );
        await tx.wait();

        // State
        const governanceEthBalanceAfter = await getERC20Balance(governance.address, wethAddress);
        const governanceUsdcBalanceAfter = await getERC20Balance(governance.address, usdcAddress);
        const governanceOsqthBalanceAfter = await getERC20Balance(governance.address, osqthAddress);
        console.log("> governanceEthBalanceAfter %s", governanceEthBalanceAfter);
        console.log("> governanceUsdcBalanceAfter %s", governanceUsdcBalanceAfter);
        console.log("> governanceOsqthBalanceAfter %s", governanceOsqthBalanceAfter);
    });

    it("feees time! 😝 greater then could", async function () {
        const fee0 = await VaultStorage.connect(governance).accruedFeesEth();
        const fee1 = await VaultStorage.connect(governance).accruedFeesUsdc();
        const fee2 = await VaultStorage.connect(governance).accruedFeesOsqth();

        let errored = false;
        try {
            tx = await Vault.connect(governance).collectProtocol(
                fee0.add(BigNumber.from(2)).toString(),
                fee1.add(BigNumber.from(2)).toString(),
                fee2.add(BigNumber.from(2)).toString(),
                governance.address
            );
            await tx.wait();
        } catch (err) {
            if (
                err.message ==
                `VM Exception while processing transaction: reverted with panic code 0x11 (Arithmetic operation underflowed or overflowed outside of an unchecked block)`
            ) {
                errored = true;
            } else console.error(err.message);
        }

        assert(errored, "No error due to input too big");
    });

    it("feees time! 😝 but not governance", async function () {
        const fee0 = await VaultStorage.connect(governance).accruedFeesEth();
        const fee1 = await VaultStorage.connect(governance).accruedFeesUsdc();
        const fee2 = await VaultStorage.connect(governance).accruedFeesOsqth();

        let errored = false;
        try {
            tx = await Vault.connect(notgovernance).collectProtocol(
                fee0.toString(),
                fee1.toString(),
                fee2.toString(),
                notgovernance.address
            );
            await tx.wait();
        } catch (err) {
            if (err.message == `VM Exception while processing transaction: reverted with reason string 'C15'`) {
                errored = true;
            } else console.error(err.message);
        }

        assert(errored, "No error due to input too big");
    });

    it("feees time! 😝 - all", async function () {
        // State
        const governanceEthBalanceBefore = await getERC20Balance(governance.address, wethAddress);
        const governanceUsdcBalanceBefore = await getERC20Balance(governance.address, usdcAddress);
        const governanceOsqthBalanceBefore = await getERC20Balance(governance.address, osqthAddress);
        console.log("> governanceEthBalanceBefore %s", governanceEthBalanceBefore);
        console.log("> governanceUsdcBalanceBefore %s", governanceUsdcBalanceBefore);
        console.log("> governanceOsqthBalanceBefore %s", governanceOsqthBalanceBefore);

        const fee0 = (await VaultStorage.connect(governance).accruedFeesEth()).toString();
        const fee1 = (await VaultStorage.connect(governance).accruedFeesUsdc()).toString();
        const fee2 = (await VaultStorage.connect(governance).accruedFeesOsqth()).toString();
        console.log("Fees:", fee0, fee1, fee2);

        tx = await Vault.connect(governance).collectProtocol(fee0, fee1, fee2, governance.address);
        await tx.wait();

        // State
        const governanceEthBalanceAfter = await getERC20Balance(governance.address, wethAddress);
        const governanceUsdcBalanceAfter = await getERC20Balance(governance.address, usdcAddress);
        const governanceOsqthBalanceAfter = await getERC20Balance(governance.address, osqthAddress);
        console.log("> governanceEthBalanceAfter %s", governanceEthBalanceAfter);
        console.log("> governanceUsdcBalanceAfter %s", governanceUsdcBalanceAfter);
        console.log("> governanceOsqthBalanceAfter %s", governanceOsqthBalanceAfter);
    });
});
