const { ethers } = require("hardhat");
const { mineSomeBlocks, resetFork, logBalance } = require("../helpers");
const { depositOCComponent, swapComponent, rebalanceClassicComponent, executeTx } = require("../helpers/components");

const { hardhatGetPerepherals, hardhatPartialDeploy } = require("@shared/deploy");

const nullAddress = "0x0000000000000000000000000000000000000000";
describe.only("Rebalance iterative", function () {
    it("Should set actors", async function () {
        [, governance, rebalancerChad, depositor1, keeper, depositor2, depositor3, notgovernance] =
            await ethers.getSigners();
    });

    let Vault, VaultAuction, VaultMath, VaultTreasury, VaultStorage, tx;
    it("Should deploy contract", async function () {
        await resetFork(16838721);

        [Vault, VaultAuction, VaultMath, VaultTreasury, VaultStorage, _arguments] = await hardhatPartialDeploy();

        [V3Helper, OneClickDeposit, OneClickWithdraw, Rebalancer, , , RebalanceModule3, RebalanceModule4] =
            await hardhatGetPerepherals(governance, keeper, rebalancerChad, _arguments, VaultStorage);

        console.log("> totalSupply:", (await Vault.totalSupply()).toString());
        console.log("> cap:", (await VaultStorage.cap()).toString());
        console.log("> balances:", (await VaultMath.getTotalAmounts()).toString());
        console.log("> ethUsdcLower", (await VaultStorage.orderEthUsdcLower()).toString());
    });

    it("deposit1", () => depositOCComponent("1", depositor1, Vault, OneClickDeposit, "user1", "955000000000000000"));

    it("deposit2", () => depositOCComponent("5", depositor2, Vault, OneClickDeposit, "user2"));

    // case #1 done
    it("2 swaps", async function () {
        this.skip();

        await mineSomeBlocks(358663);
        await swapComponent("WETH_USDC", "1000", V3Helper, true);
        await mineSomeBlocks(600);
        await mineSomeBlocks(600); //13
    }).timeout(1000000);

    //case #2 done
    it("2 swaps", async function () {
        this.skip();

        await mineSomeBlocks(358663);
        await swapComponent("WETH_USDC", "1000", V3Helper, true);
        await swapComponent("WETH_OSQTH", "150", V3Helper, true);
        await mineSomeBlocks(600);
        await mineSomeBlocks(100); //13
    }).timeout(1000000);

    // case #3 done
    it("2 swaps", async function () {
        this.skip();

        await mineSomeBlocks(358663);
        await swapComponent("WETH_USDC", "10000", V3Helper, true);
        await swapComponent("WETH_OSQTH", "150", V3Helper, true);
        await mineSomeBlocks(600);
        await mineSomeBlocks(100); //13
    }).timeout(1000000);

    //case #4
    it("2 swaps", async function () {
        // this.skip();

        await mineSomeBlocks(358663);
        await swapComponent("USDC_WETH", "1000000", V3Helper, true);
        await mineSomeBlocks(600);
        await mineSomeBlocks(300); //13
    }).timeout(1000000);

    // case #5 done
    it("2 swaps", async function () {
        this.skip();

        await mineSomeBlocks(358663);
        await swapComponent("WETH_USDC", "1000", V3Helper, true);
        await mineSomeBlocks(600);
        await mineSomeBlocks(100); //13
    }).timeout(1000000);

    //case #6 done
    it("2 swaps", async function () {
        this.skip();

        await mineSomeBlocks(358663);
        await swapComponent("WETH_USDC", "10000", V3Helper, true);
        await swapComponent("OSQTH_WETH", "1000", V3Helper, true);
        await mineSomeBlocks(600);
        await mineSomeBlocks(600); //13
    }).timeout(1000000);

    // it("rebalance", () => rebalanceClassicComponent(rebalancerChad, Rebalancer, RebalanceModule4));

    it("rebalance new cheap", async () => {
        inface = new ethers.utils.Interface(["function rebalance(uint256 threshold, uint256 triggerTime)"]);
        data = inface.encodeFunctionData("rebalance", [0, ethers.utils.parseUnits("103", 16).toString()]);

        await logBalance(RebalanceModule4.address, "> RebalanceModule before rebalance");

        await executeTx(
            Rebalancer.connect(rebalancerChad).complexCall(
                RebalanceModule4.address,
                data,
                nullAddress,
                RebalanceModule4.address,
                "999900000000000000"
            ),
            "new classic Rebalance",
            true
        );

        await logBalance(RebalanceModule4.address, "> RebalanceModule after rebalance");
    });
});
