const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const { utils } = ethers;
const { wethAddress, osqthAddress, usdcAddress } = require("@shared/constants");
const {
    mineSomeBlocks,
    resetFork,
    logBlock,
    getAndApprove2,
    logBalance,
    getERC20Balance,
    getWETH,
    getOSQTH,
    getUSDC,
    approveERC20,
} = require("../helpers");
const { deploymentParams, deployContract, hardhatDeploy } = require("@shared/deploy");

describe.skip("Flash deposit", function () {
    let swaper, depositor1, depositor2, depositor3, keeper, governance, swapAmount;
    let Vault, VaultAuction, VaultMath, VaultTreasury, VaultStorage, tx, receipt, OneClickDeposit;

    const presets = {
        depositor1: {
            wethInput: "19987318809022169042",
            usdcInput: "15374822619",
            osqthInput: "113434930214010428403",
        },
        depositor2: {
            wethInput: utils.parseUnits("1", 18),
            usdcInput: 0,
            osqthInput: 0,
        },
    };
    it("Should set actors", async function () {
        await resetFork(15173789);
        const signers = await ethers.getSigners();
        governance = signers[0];
        depositor1 = signers[7];
        depositor2 = signers[8];

        const params = [...deploymentParams];
        deploymentParams[6] = "10000";
        [Vault, VaultAuction, VaultMath, VaultTreasury, VaultStorage] = await hardhatDeploy(governance, params);

        OneClickDeposit = await deployContract("OneClickDeposit", [], false);

        OneClickWithdraw = await deployContract("OneClickWithdraw", [], false);

        tx = await OneClickDeposit.setContracts(Vault.address);
        await tx.wait();

        tx = await OneClickWithdraw.setContracts(Vault.address);
        await tx.wait();

        await getAndApprove2(
            depositor1,
            Vault.address,
            presets.depositor1.wethInput,
            presets.depositor1.usdcInput,
            presets.depositor1.osqthInput
        );
        await getAndApprove2(
            depositor2,
            OneClickDeposit.address,
            presets.depositor2.wethInput,
            presets.depositor2.usdcInput,
            presets.depositor2.osqthInput
        );

        await logBalance(depositor2.address, "> user2 Balance Before All");
        console.log("> user2 Balance Before All Share", await getERC20Balance(depositor2.address, Vault.address));
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

        await logBalance(depositor2.address, "> user1 Balance After Deposit");
        console.log("> user1 Balance After Deposit Share", await getERC20Balance(depositor2.address, Vault.address));
    });

    it("deposit2", async function () {
        tx = await OneClickDeposit.connect(depositor2).deposit(
            utils.parseUnits("1", 18),
            utils.parseUnits("99", 16),
            depositor2.address,
            "0"
        );
        receipt = await tx.wait();
        console.log("> Gas used flashDepsoit: %s", receipt.gasUsed);

        await logBalance(depositor2.address, "> user2 Balance After Deposit");
        console.log("> user2 Balance After Deposit Share", await getERC20Balance(depositor2.address, Vault.address));
        await logBalance(depositor2.address, "> OneClickDeposit balance weth afer deposit");
    });

    it("withdraw", async function () {
        await logBalance(depositor2.address, "> user2 Balance Before Witdraw:");
        console.log("> user2 Balance Before Witdraw: Share", await getERC20Balance(depositor2.address, Vault.address));
        await logBalance(OneClickWithdraw.address, "> OneClickWithdraw balance weth before witdraw:");

        const allShares = await getERC20Balance(depositor2.address, Vault.address);
        await approveERC20(depositor2, OneClickWithdraw.address, allShares, Vault.address);
        tx = await OneClickWithdraw.connect(depositor2).withdraw(depositor2.address, allShares, "0", "0", "0");
        await tx.wait();

        await logBalance(depositor2.address, "> user2 Balance After Witdraw:");
        console.log("> user2 Balance After Witdraw: Share", await getERC20Balance(depositor2.address, Vault.address));
        await logBalance(OneClickWithdraw.address, "> OneClickWithdraw balance weth afer witdraw:");
    });
});
