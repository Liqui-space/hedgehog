const { ethers } = require("hardhat");
const { mineSomeBlocks, resetFork, logBlock, getERC20Balance, logBalance } = require("../helpers");
const {
    depositOCComponent,
    withdrawComponent,
    shouldThrowErrorComponent,
    swapComponent,
    rebalanceClassicComponent,
} = require("../helpers/components");

const { hardhatDeploy, deploymentParams, hardhatGetPerepherals } = require("@shared/deploy");
const { BigNumber } = require("ethers");

describe.only("General Workflow", function () {
    it("Should set actors", async function () {
        [, governance, rebalancerChad, depositor1, keeper, depositor2, depositor3] = await ethers.getSigners();
    });

    let Vault, VaultAuction, VaultMath, VaultTreasury, VaultStorage, tx;
    it("Should deploy contract", async function () {
        await resetFork(16586904);

        const params = [...deploymentParams];
        params[6] = "0";
        [Vault, VaultAuction, VaultMath, VaultTreasury, VaultStorage, _arguments] = await hardhatDeploy(
            governance.address,
            params,
            keeper.address
        );

        [V3Helper, OneClickDeposit, OneClickWithdraw, Rebalancer, , , RebalanceModule3, RebalanceModule4] =
            await hardhatGetPerepherals(governance, keeper, rebalancerChad, _arguments, VaultStorage);
    });

    it("deposit1", () => depositOCComponent("20", depositor1, Vault, OneClickDeposit, "user1"));

    // it("withdraw1 -> No liquidity", async function () {
    //     const allShares = await getERC20Balance(depositor1.address, Vault.address);

    //     await shouldThrowErrorComponent(
    //         withdrawComponent(BigNumber.from(allShares).div(2), depositor1, Vault, "user1"),
    //         "C4",
    //         "Limit wat not reached"
    //     );
    // });

    // it("deposit2", () => depositOCComponent("29", depositor2, Vault, OneClickDeposit, "user2"));

    it("2 swaps", async function () {
        await mineSomeBlocks(6000);
        await swapComponent("WETH_USDC", "100", V3Helper);
        await mineSomeBlocks(200);
        await swapComponent("OSQTH_WETH", "40", V3Helper);
        await mineSomeBlocks(81000);
    });

    it("rebalance", () => rebalanceClassicComponent(rebalancerChad, Rebalancer, RebalanceModule4));

    return;
    it("deposit3 -> cap limit", async function () {
        console.log("> totalSupply:", await Vault.totalSupply());

        await shouldThrowErrorComponent(
            depositOCComponent("200", depositor3, Vault, oneClickDeposit, "user3"),
            "C4",
            "Cap was not reached"
        );
    });

    it("deposit3", () => depositOCComponent("45", depositor3, Vault, OneClickDeposit, "user3", "990000000000000000"));

    it("withdraw2", async function () {
        const allShares = await getERC20Balance(depositor2.address, Vault.address);
        await withdrawComponent(allShares, depositor2, Vault, "user2");
    });

    it("swap", async function () {
        await mineSomeBlocks(2216);
        await swapComponent("USDC_WETH", "1000000", V3Helper, true);
        await mineSomeBlocks(554);
        await swapComponent("WETH_OSQTH", "100", V3Helper, true);
        await mineSomeBlocks(554);
    });

    it("rebalance2", async function () {
        await mineSomeBlocks(83622);
        await rebalanceClassicComponent(rebalance, Rebalancer, RebalanceModule4);
    });

    it("withdraw1", async function () {
        const allShares = await getERC20Balance(depositor1.address, Vault.address);
        await withdrawComponent(allShares, depositor1, Vault, "user1");
    });

    it("swap", async function () {
        await mineSomeBlocks(2216);
        await swapComponent("USDC_WETH", "33000000", V3Helper);
        await logBlock();
        await swapComponent("WETH_OSQTH", "1500", V3Helper);
    });

    it("price rebalance", async function () {
        await mineSomeBlocks(200);
        await logBlock();
        await logBalance(governance.address, "> Governance Balance Before price rebalance");
        await mineSomeBlocks(1250);

        tx = await rebalancerChad.connect(governance).rebalance(0, 1663937523);
        await tx.wait();

        await logBalance(governance.address, "> Governance Balance After price rebalance");
    });

    it("withdraw3", async function () {
        const allShares = await getERC20Balance(depositor3.address, Vault.address);
        await withdrawComponent(allShares, depositor3, Vault, "user3");
    });

    it("feees time! 😝 only half", async function () {
        await logBalance(governance, "> governance before");

        const fee0 = await VaultStorage.connect(governance).accruedFeesEth();
        const fee1 = await VaultStorage.connect(governance).accruedFeesUsdc();
        const fee2 = await VaultStorage.connect(governance).accruedFeesOsqth();
        console.log("Fees:", fee0.toString(), fee1.toString(), fee2.toString());

        tx = await Vault.connect(governance).collectProtocol(
            fee0.div(BigNumber.from(2)),
            fee1.div(BigNumber.from(2)),
            fee2.div(BigNumber.from(2)),
            governance.address
        );
        await tx.wait();

        await logBalance(governance, "> governance after");
    });

    it("feees time! 😝 greater then could", async function () {
        const fee0 = await VaultStorage.connect(governance).accruedFeesEth();
        const fee1 = await VaultStorage.connect(governance).accruedFeesUsdc();
        const fee2 = await VaultStorage.connect(governance).accruedFeesOsqth();

        await shouldThrowErrorComponent(
            Vault.connect(governance).collectProtocol(
                fee0.add(BigNumber.from(2)),
                fee1.add(BigNumber.from(2)),
                fee2.add(BigNumber.from(2)),
                governance.address
            ),
            "VM Exception while processing transaction: reverted with panic code 0x11 (Arithmetic operation underflowed or overflowed outside of an unchecked block)",
            "No error due to input too big"
        );
    });

    it("feees time! 😝 but not governance", async function () {
        const fee0 = await VaultStorage.connect(governance).accruedFeesEth();
        const fee1 = await VaultStorage.connect(governance).accruedFeesUsdc();
        const fee2 = await VaultStorage.connect(governance).accruedFeesOsqth();

        await shouldThrowErrorComponent(
            Vault.connect(notgovernance).collectProtocol(fee0, fee1, fee2, notgovernance.address),
            "C15",
            "No error due to input too big"
        );
    });

    it("feees time! 😝 - all", async function () {
        await logBalance(governance, "> governance before");
        const fee0 = await VaultStorage.connect(governance).accruedFeesEth();
        const fee1 = await VaultStorage.connect(governance).accruedFeesUsdc();
        const fee2 = await VaultStorage.connect(governance).accruedFeesOsqth();
        console.log("Fees:", fee0.toString(), fee1.toString(), fee2.toString());

        tx = await Vault.connect(governance).collectProtocol(fee0, fee1, fee2, governance.address);
        await tx.wait();

        await logBalance(governance, "> governance after");
    });
});
