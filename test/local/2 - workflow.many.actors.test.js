const { ethers } = require("hardhat");
const { mineSomeBlocks, resetFork, getERC20Balance } = require("../helpers");
const { hardhatDeploy, deploymentParams, hardhatGetPerepherals } = require("@shared/deploy");

const { depositOCComponent, withdrawComponent, swapComponent } = require("../helpers/components");

describe.skip("Workflow with many actors", function () {
    it("Should set actors", async function () {
        [owner, governance, rebalancer, depositor1, keeper, swaper, depositor2, depositor3] = await ethers.getSigners();
    });

    let Vault, VaultAuction, VaultMath, VaultTreasury, VaultStorage;
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
            await hardhatGetPerepherals(governance, keeper, rebalancer, _arguments, VaultStorage);
    });

    it("deposit1", () => depositOCComponent("1", depositor1, Vault, OneClickDeposit, "user1"));

    it("2 swaps", async function () {
        await mineSomeBlocks(2216);
        await swapComponent("WETH_USDC", "100", V3Helper);
        await mineSomeBlocks(554);
        await swapComponent("OSQTH_WETH", "30", V3Helper);
        await mineSomeBlocks(554);
    });

    it("rebalance1", () => rebalanceClassicComponent(rebalance, Rebalancer, RebalanceModule4));

    it("deposit2", () => depositOCComponent("1", depositor2, Vault, OneClickDeposit, "user2"));

    it("deposit3", () => depositOCComponent("1", depositor3, Vault, OneClickDeposit, "user3"));

    it("2 swaps", async function () {
        await mineSomeBlocks(2216);
        await swapComponent("WETH_USDC", "100", V3Helper);
        await mineSomeBlocks(554);
        await swapComponent("OSQTH_WETH", "30", V3Helper);
        await mineSomeBlocks(554);
    });

    it("deposit4", () => depositOCComponent("1", depositor4, Vault, OneClickDeposit, "user4"));

    it("2 swaps", async function () {
        await mineSomeBlocks(2216);
        await swapComponent("WETH_USDC", "100", V3Helper);
        await mineSomeBlocks(554);
        await swapComponent("OSQTH_WETH", "30", V3Helper);
        await mineSomeBlocks(554);
    });

    it("deposit5", () => depositOCComponent("1", depositor5, Vault, OneClickDeposit, "user5"));

    it("2 swaps", async function () {
        await mineSomeBlocks(2216);
        await swapComponent("WETH_USDC", "100", V3Helper);
        await mineSomeBlocks(554);
        await swapComponent("OSQTH_WETH", "30", V3Helper);
        await mineSomeBlocks(554);
    });

    it("withdraw1", async function () {
        const allShares = await getERC20Balance(depositor1.address, Vault.address);
        await withdrawComponent(allShares, depositor1, Vault, "user1");
    });

    it("withdraw2", async function () {
        const allShares = await getERC20Balance(depositor2.address, Vault.address);
        await withdrawComponent(allShares, depositor2, Vault, "user2");
    });

    it("withdraw3", async function () {
        const allShares = await getERC20Balance(depositor3.address, Vault.address);
        await withdrawComponent(allShares, depositor3, Vault, "user3");
    });

    it("withdraw4", async function () {
        const allShares = await getERC20Balance(depositor4.address, Vault.address);
        await withdrawComponent(allShares, depositor4, Vault, "user4");
    });

    it("withdraw5", async function () {
        const allShares = await getERC20Balance(depositor5.address, Vault.address);
        await withdrawComponent(allShares, depositor5, Vault, "user5");
    });

    it("rebalance2", async function () {
        await mineSomeBlocks(83622);
        await rebalanceClassicComponent(rebalance, Rebalancer, RebalanceModule4);
    });
});
