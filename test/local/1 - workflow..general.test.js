const { ethers } = require("hardhat");
const { mineSomeBlocks, resetFork, logBlock, getERC20Balance, logBalance } = require("../helpers");
const {
    depositOCComponent,
    withdrawComponent,
    shouldThrowErrorComponent,
    swapComponent,
    rebalanceClassicComponent,
    executeTx,
} = require("../helpers/components");

const { deploymentParams, hardhatGetPerepherals, hardhatPartialDeploy } = require("@shared/deploy");
const { BigNumber } = require("ethers");

describe.only("General Workflow", function () {
    it("Should set actors", async function () {
        [, governance, rebalancerChad, depositor1, keeper, depositor2, depositor3, notgovernance] =
            await ethers.getSigners();
    });

    let Vault, VaultAuction, VaultMath, VaultTreasury, VaultStorage, tx;
    it("Should deploy contract", async function () {
        await resetFork(16754599);

        const params = [...deploymentParams];
        params[6] = "0";
        [Vault, VaultAuction, VaultMath, VaultTreasury, VaultStorage, _arguments] = await hardhatPartialDeploy(
            governance.address,
            params,
            keeper.address
        );

        [V3Helper, OneClickDeposit, OneClickWithdraw, Rebalancer, , , RebalanceModule3, RebalanceModule4] =
            await hardhatGetPerepherals(governance, keeper, rebalancerChad, _arguments, VaultStorage);

        console.log("> totalSupply:", (await Vault.totalSupply()).toString());
        console.log("> cap:", (await VaultStorage.cap()).toString());
        console.log("> balances:", (await VaultMath.getTotalAmounts()).toString());
        console.log("> ethUsdcLower", (await VaultStorage.orderEthUsdcLower()).toString());
    });

    it("deposit1", () => depositOCComponent("1", depositor1, Vault, OneClickDeposit, "user1"));

    it("deposit2", () => depositOCComponent("5", depositor2, Vault, OneClickDeposit, "user2"));

    it("2 swaps", async function () {
        await mineSomeBlocks(6000);
        await swapComponent("WETH_USDC", "100", V3Helper);
        await mineSomeBlocks(200);
        await swapComponent("OSQTH_WETH", "40", V3Helper);
        await mineSomeBlocks(81000);
    });

    it("rebalance", () => rebalanceClassicComponent(rebalancerChad, Rebalancer, RebalanceModule4));

    // it("deposit3 -> cap limit", async function () {
    //     console.log("> totalSupply:", (await Vault.totalSupply()).toString());
    //     console.log("> cap:", (await VaultStorage.cap()).toString());

    //     await shouldThrowErrorComponent(
    //         depositOCComponent("1000", depositor3, Vault, OneClickDeposit, "user3"),
    //         "C4",
    //         "Cap was not reached"
    //     );
    // });

    it("deposit3", () => depositOCComponent("5", depositor3, Vault, OneClickDeposit, "user3", "990000000000000000"));

    it("withdraw2", async function () {
        console.log("> Amounts:", (await VaultMath.getTotalAmounts()).toString());
        console.log("> totalSupply:", (await Vault.totalSupply()).toString());

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
        await rebalanceClassicComponent(rebalancerChad, Rebalancer, RebalanceModule4);
    });

    it("withdraw1", async function () {
        const allShares = await getERC20Balance(depositor1.address, Vault.address);
        await withdrawComponent(allShares, depositor1, Vault, "user1");
    });

    it("swap", async function () {
        await mineSomeBlocks(2216);
        await swapComponent("USDC_WETH", "3300000", V3Helper, true);
        await logBlock();
        await swapComponent("WETH_OSQTH", "1500", V3Helper, true);
    }).timeout(10000000);

    // it("price rebalance", async function () {
    //     await mineSomeBlocks(200);
    //     await logBlock();
    //     await logBalance(rebalancerChad.address, "> rebalancerChad Balance Before price rebalance");
    //     await mineSomeBlocks(1250);

    //     tx = await VaultAuction.connect(rebalancerChad).priceRebalance(rebalancerChad.address, 1663937523, 0, 0, 0);
    //     await tx.wait();

    //     await logBalance(rebalancerChad.address, "> rebalancerChad Balance After price rebalance");
    // });

    it("withdraw3", async function () {
        const allShares = await getERC20Balance(depositor3.address, Vault.address);
        await withdrawComponent(allShares, depositor3, Vault, "user3");
    });

    it("feees time! 😝 only half", async function () {
        await executeTx(Rebalancer.connect(rebalancerChad).setGovernance(governance.address));

        await logBalance(governance, "> governance before");

        const fee0 = await VaultStorage.connect(governance).accruedFeesEth();
        const fee1 = await VaultStorage.connect(governance).accruedFeesUsdc();
        const fee2 = await VaultStorage.connect(governance).accruedFeesOsqth();
        console.log("Fees:", fee0.toString(), fee1.toString(), fee2.toString());

        await executeTx(
            Vault.connect(governance).collectProtocol(
                fee0.div(BigNumber.from(2)),
                fee1.div(BigNumber.from(2)),
                fee2.div(BigNumber.from(2)),
                governance.address
            )
        );

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

        await executeTx(Vault.connect(governance).collectProtocol(fee0, fee1, fee2, governance.address));

        await logBalance(governance, "> governance after");
    });
});
