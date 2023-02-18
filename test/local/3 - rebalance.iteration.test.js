const { ethers } = require("hardhat");
const { mineSomeBlocks, resetFork, logBalance } = require("../helpers");
const { hardhatPartialDeploy, deploymentParams, hardhatGetPerepherals } = require("@shared/deploy");

const { depositOCComponent, swapComponent, executeTx } = require("../helpers/components");

describe.only("Test of Rebalance in different market conditions", function () {
    it("Should set actors", async function () {
        [, governance, rebalancerChad, depositor1, keeper, depositor2, depositor3, notgovernance] =
            await ethers.getSigners();
    });

    let Vault, VaultAuction, VaultMath, VaultTreasury, VaultStorage, tx;
    it("Should deploy contract", async function () {
        await resetFork(16634147);

        const params = [...deploymentParams];
        params[6] = "0";
        [Vault, VaultAuction, VaultMath, VaultTreasury, VaultStorage, _arguments] = await hardhatPartialDeploy(
            governance.address,
            params,
            keeper.address
        );

        [V3Helper, OneClickDeposit, OneClickWithdraw, Rebalancer, , , RebalanceModule3, RebalanceModule4] =
            await hardhatGetPerepherals(governance, keeper, rebalancerChad, _arguments, VaultStorage);
    });

    it("deposit1", () => depositOCComponent("4", depositor1, Vault, OneClickDeposit, "user1"));

    it("2 swaps", async function () {
        await mineSomeBlocks(6000);
        await swapComponent("WETH_USDC", "100", V3Helper);
        await mineSomeBlocks(200);
        await swapComponent("OSQTH_WETH", "40", V3Helper);
        await mineSomeBlocks(81000);
    });

    it("rebalance", async () => {
        const RebalanceModule = RebalanceModule4;
        await logBalance(RebalanceModule.address, "> RebalanceModule before rebalance");

        await executeTx(Rebalancer.connect(rebalancerChad).rebalanceClassic(RebalanceModule.address, 0));

        await logBalance(RebalanceModule.address, "> RebalanceModule after rebalance");
    });
});
