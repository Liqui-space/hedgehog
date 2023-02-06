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
} = require("../helpers");
const { hardhatDeploy, deploymentParams } = require("@shared/deploy");
const { BigNumber } = require("ethers");

describe.skip("User story with: withdraw protocol fees", function () {
    let swaper, depositor1, depositor2, depositor3, keeper, governance, notgovernance, swapAmount;
    it("Should set actors", async function () {
        const signers = await ethers.getSigners();
        governance = signers[0];
        notgovernance = signers[1];
        depositor1 = signers[7];
        keeper = signers[8];
        swaper = signers[9];
        depositor2 = signers[10];
        depositor3 = signers[11];
    });

    let Vault, VaultAuction, VaultMath, VaultTreasury, VaultStorage, tx;
    it("Should deploy contract", async function () {
        await resetFork(15173789);

        //? Check's oSQTH if not enough
        // console.log("> OSQTH holder:", (await getERC20Balance(_biggestOSqthHolder, osqthAddress)).toString().slice(0, -18));

        const params = [...deploymentParams];
        params[6] = "10000";
        [Vault, VaultAuction, VaultMath, VaultTreasury, VaultStorage] = await hardhatDeploy(governance, params);
        await logBlock();

        const ContractHelper = await ethers.getContractFactory("V3Helper");
        contractHelper = await ContractHelper.deploy();
        await contractHelper.deployed();
    });

    const presets = {
        depositor1: {
            wethInput: "19987318809022169042",
            usdcInput: "15374822619",
            osqthInput: "113434930214010428403",
        },
        depositor2: {
            wethInput: "29987318809025550479",
            usdcInput: "23067111297",
            osqthInput: "170188380388050211866",
        },
        depositor3: {
            wethInput: "26418885994532528989",
            usdcInput: "12506405330",
            osqthInput: "204482223867910110089",
        },
        keeper: {
            // Added here amounts for 2 reabalances
            wethInput: BigNumber.from("46420453093069060030").add(BigNumber.from("7611641957027153635")).toString(),
            usdcInput: BigNumber.from("35170786530").add(BigNumber.from("6086663569")).toString(),
            osqthInput: BigNumber.from("226662623566831825098").add(BigNumber.from("38536032101104376335")).toString(),
        },
    };
    it("preset", async function () {
        await getAndApprove2(
            keeper,
            VaultAuction.address,
            presets.keeper.wethInput,
            presets.keeper.usdcInput,
            presets.keeper.osqthInput
        );
        await getAndApprove2(
            depositor1,
            Vault.address,
            presets.depositor1.wethInput,
            presets.depositor1.usdcInput,
            presets.depositor1.osqthInput
        );
        await getAndApprove2(
            depositor2,
            Vault.address,
            presets.depositor2.wethInput,
            presets.depositor2.usdcInput,
            presets.depositor2.osqthInput
        );
        await getAndApprove2(
            depositor3,
            Vault.address,
            presets.depositor3.wethInput,
            presets.depositor3.usdcInput,
            presets.depositor3.osqthInput
        );
    });

    it("deposit1", async function () {
        tx = await Vault.connect(depositor1).deposit(
            "17630456391863397407",
            "29892919002",
            "33072912443025954753",
            depositor1.address,
            "0",
            "0",
            "0"
        );
        await tx.wait();

        // State
        const userEthBalanceAfterDeposit = await getERC20Balance(depositor1.address, wethAddress);
        const userUsdcBalanceAfterDeposit = await getERC20Balance(depositor1.address, usdcAddress);
        const userOsqthBalanceAfterDeposit = await getERC20Balance(depositor1.address, osqthAddress);
        const userShareAfterDeposit = await getERC20Balance(depositor1.address, Vault.address);

        console.log("> userEthBalanceAfterDeposit %s", userEthBalanceAfterDeposit);
        console.log("> userUsdcBalanceAfterDeposit %s", userUsdcBalanceAfterDeposit);
        console.log("> userOsqthBalanceAfterDeposit %s", userOsqthBalanceAfterDeposit);
        console.log("> userShareAfterDeposit", userShareAfterDeposit);
    });

    it("deposit2", async function () {
        tx = await Vault.connect(depositor2).deposit(
            "7630456391863397407",
            "9892919002",
            "3072912443025954753",
            depositor2.address,
            "0",
            "0",
            "0"
        );
        await tx.wait();

        // State
        const userEthBalanceAfterDeposit = await getERC20Balance(depositor2.address, wethAddress);
        const userUsdcBalanceAfterDeposit = await getERC20Balance(depositor2.address, usdcAddress);
        const userOsqthBalanceAfterDeposit = await getERC20Balance(depositor2.address, osqthAddress);
        const userShareAfterDeposit = await getERC20Balance(depositor2.address, Vault.address);

        console.log("> userEthBalanceAfterDeposit %s", userEthBalanceAfterDeposit);
        console.log("> userUsdcBalanceAfterDeposit %s", userUsdcBalanceAfterDeposit);
        console.log("> userOsqthBalanceAfterDeposit %s", userOsqthBalanceAfterDeposit);
        console.log("> userShareAfterDeposit", userShareAfterDeposit);
    });

    it("swap1", async function () {
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

    it("rebalance", async function () {
        await mineSomeBlocks(83622);

        const keeperEthBalanceBeforeRebalance = await getERC20Balance(keeper.address, wethAddress);
        const keeperUsdcBalanceBeforeRebalance = await getERC20Balance(keeper.address, usdcAddress);
        const keeperOsqthBalanceBeforeRebalance = await getERC20Balance(keeper.address, osqthAddress);
        console.log("> Keeper ETH balance before rebalance %s", keeperEthBalanceBeforeRebalance);
        console.log("> Keeper USDC balance before rebalance %s", keeperUsdcBalanceBeforeRebalance);
        console.log("> Keeper oSQTH balance before rebalance %s", keeperOsqthBalanceBeforeRebalance);

        tx = await VaultAuction.connect(keeper).timeRebalance(keeper.address, 0, 0, 0);
        await tx.wait();

        const ethAmountK = await getERC20Balance(keeper.address, wethAddress);
        const usdcAmountK = await getERC20Balance(keeper.address, usdcAddress);
        const osqthAmountK = await getERC20Balance(keeper.address, osqthAddress);
        console.log("> Keeper ETH balance after rebalance %s", ethAmountK);
        console.log("> Keeper USDC balance after rebalance %s", usdcAmountK);
        console.log("> Keeper oSQTH balance after rebalance %s", osqthAmountK);

        const amount = await VaultMath.getTotalAmounts();
        console.log("> Total amounts:", amount);
    });

    it("deposit3", async function () {
        tx = await Vault.connect(depositor3).deposit(
            "7630456391863397407",
            "9892919002",
            "3072912443025954753",
            depositor3.address,
            "0",
            "0",
            "0"
        );
        await tx.wait();

        // State
        const userEthBalanceAfterDeposit = await getERC20Balance(depositor3.address, wethAddress);
        const userUsdcBalanceAfterDeposit = await getERC20Balance(depositor3.address, usdcAddress);
        const userOsqthBalanceAfterDeposit = await getERC20Balance(depositor3.address, osqthAddress);
        const userShareAfterDeposit = await getERC20Balance(depositor3.address, Vault.address);

        console.log("> userEthBalanceAfterDeposit %s", userEthBalanceAfterDeposit);
        console.log("> userUsdcBalanceAfterDeposit %s", userUsdcBalanceAfterDeposit);
        console.log("> userOsqthBalanceAfterDeposit %s", userOsqthBalanceAfterDeposit);
        console.log("> userShareAfterDeposit", userShareAfterDeposit);
    });

    it("withdraw2", async function () {
        tx = await Vault.connect(depositor2).withdraw(
            await getERC20Balance(depositor2.address, Vault.address),
            "0",
            "0",
            "0"
        );
        await tx.wait();

        // State
        const userEthBalanceAfterWithdraw = await getERC20Balance(depositor2.address, wethAddress);
        const userUsdcBalanceAfterWithdraw = await getERC20Balance(depositor2.address, usdcAddress);
        const userOsqthBalanceAfterWithdraw = await getERC20Balance(depositor2.address, osqthAddress);
        const userShareAfterWithdraw = await getERC20Balance(depositor2.address, Vault.address);
        console.log("> userEthBalanceAfterWithdraw %s", userEthBalanceAfterWithdraw);
        console.log("> userUsdcBalanceAfterWithdraw %s", userUsdcBalanceAfterWithdraw);
        console.log("> userOsqthBalanceAfterWithdraw %s", userOsqthBalanceAfterWithdraw);
        console.log("> userShareAfterWithdraw", userShareAfterWithdraw);
    });

    it("swap2", async function () {
        await mineSomeBlocks(1108);

        swapAmount = utils.parseUnits("1000000", 6).toString();
        await getUSDC(swapAmount, contractHelper.address);
        const beforeSwapWETH = await getERC20Balance(contractHelper.address, wethAddress);
        console.log("> WETH before swap:", beforeSwapWETH);
        console.log("> USDC before swap:", await getERC20Balance(contractHelper.address, usdcAddress));
        tx = await contractHelper.connect(swaper).swapUSDC_WETH(swapAmount);
        await tx.wait();
        const afterSwapWETH = await getERC20Balance(contractHelper.address, wethAddress);
        console.log("> WETH after swap:", await getERC20Balance(contractHelper.address, wethAddress));
        console.log("> USDC after swap:", await getERC20Balance(contractHelper.address, usdcAddress));

        const newETH = BigNumber.from(afterSwapWETH).sub(BigNumber.from(beforeSwapWETH));
        await mineSomeBlocks(1108);

        swapAmount = newETH.toString();
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

        const keeperEthBalanceBeforeRebalance = await getERC20Balance(keeper.address, wethAddress);
        const keeperUsdcBalanceBeforeRebalance = await getERC20Balance(keeper.address, usdcAddress);
        const keeperOsqthBalanceBeforeRebalance = await getERC20Balance(keeper.address, osqthAddress);
        console.log("> Keeper ETH balance before rebalance %s", keeperEthBalanceBeforeRebalance);
        console.log("> Keeper USDC balance before rebalance %s", keeperUsdcBalanceBeforeRebalance);
        console.log("> Keeper oSQTH balance before rebalance %s", keeperOsqthBalanceBeforeRebalance);

        tx = await VaultAuction.connect(keeper).timeRebalance(keeper.address, 0, 0, 0);
        await tx.wait();

        const ethAmountK = await getERC20Balance(keeper.address, wethAddress);
        const usdcAmountK = await getERC20Balance(keeper.address, usdcAddress);
        const osqthAmountK = await getERC20Balance(keeper.address, osqthAddress);
        console.log("> Keeper ETH balance after rebalance %s", ethAmountK);
        console.log("> Keeper USDC balance after rebalance %s", usdcAmountK);
        console.log("> Keeper oSQTH balance after rebalance %s", osqthAmountK);

        const amount = await VaultMath.getTotalAmounts();
        console.log("> Total amounts:", amount);
    }).timeout(1000000);

    it("withdraw1", async function () {
        tx = await Vault.connect(depositor1).withdraw(
            await getERC20Balance(depositor1.address, Vault.address),
            "0",
            "0",
            "0"
        );
        await tx.wait();

        // State
        const userEthBalanceAfterWithdraw = await getERC20Balance(depositor1.address, wethAddress);
        const userUsdcBalanceAfterWithdraw = await getERC20Balance(depositor1.address, usdcAddress);
        const userOsqthBalanceAfterWithdraw = await getERC20Balance(depositor1.address, osqthAddress);
        const userShareAfterWithdraw = await getERC20Balance(depositor1.address, Vault.address);
        console.log("> userEthBalanceAfterWithdraw %s", userEthBalanceAfterWithdraw);
        console.log("> userUsdcBalanceAfterWithdraw %s", userUsdcBalanceAfterWithdraw);
        console.log("> userOsqthBalanceAfterWithdraw %s", userOsqthBalanceAfterWithdraw);
        console.log("> userShareAfterWithdraw", userShareAfterWithdraw);
    });

    it("withdraw3", async function () {
        tx = await Vault.connect(depositor3).withdraw(
            await getERC20Balance(depositor3.address, Vault.address),
            "0",
            "0",
            "0"
        );
        await tx.wait();

        // State
        const userEthBalanceAfterWithdraw = await getERC20Balance(depositor3.address, wethAddress);
        const userUsdcBalanceAfterWithdraw = await getERC20Balance(depositor3.address, usdcAddress);
        const userOsqthBalanceAfterWithdraw = await getERC20Balance(depositor3.address, osqthAddress);
        const userShareAfterWithdraw = await getERC20Balance(depositor3.address, Vault.address);
        console.log("> userEthBalanceAfterWithdraw %s", userEthBalanceAfterWithdraw);
        console.log("> userUsdcBalanceAfterWithdraw %s", userUsdcBalanceAfterWithdraw);
        console.log("> userOsqthBalanceAfterWithdraw %s", userOsqthBalanceAfterWithdraw);
        console.log("> userShareAfterWithdraw", userShareAfterWithdraw);

        const amount = await VaultMath.getTotalAmounts();
        console.log("> Total amounts:", amount);
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
