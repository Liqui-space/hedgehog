const { ethers } = require("hardhat");
const { _governanceAddress, _hedgehogPeripheralsDeployer } = require("@shared/constants");

const { hardhatInitializedDeploy, hardhatDeploy, hardhatGetPerepherals } = require("@shared/deploy");
const { resetFork, impersontate, getETH } = require("../helpers");

describe.skip("Fee test", function () {
    let tx;

    it("Should deploy contract", async function () {
        await resetFork(16421382);
        governance = await impersontate(_governanceAddress);
        hedgehogPeripheralsDeployer = await impersontate(_hedgehogPeripheralsDeployer);

        [Vault, , VaultMath, ,] = await hardhatDeploy(governance);
        [Vault, , VaultMath, ,] = await hardhatInitializedDeploy();
        [Rebalancer, RebalanceModule1] = await hardhatGetPerepherals();

        await getETH(hedgehogPeripheralsDeployer.address, ethers.utils.parseEther("2.0"));
        await getETH(governance.address, ethers.utils.parseEther("2.0"));
    });

    it("getParams", async function () {
        this.skip();
        const amounts0 = await VaultMath.getTotalAmounts();

        tx = await Rebalancer.connect(hedgehogPeripheralsDeployer).returnOwner(hedgehogPeripheralsDeployer.address);
        await tx.wait();

        tx = await RebalanceModule1.connect(hedgehogPeripheralsDeployer).setKeeper(hedgehogPeripheralsDeployer.address);
        await tx.wait();

        tx = await Treasury.connect(hedgehogPeripheralsDeployer).externalPoke();
        await tx.wait();

        const amounts1 = await VaultMath.getTotalAmounts();

        const ethDiff = (amounts1[0] - amounts0[0]).toString();
        const usdcDiff = (amounts1[1] - amounts0[1]).toString();
        const osqthDiff = (amounts1[2] - amounts0[2]).toString();

        const prices = await VaultMath.getPrices();
        const feeValue = await VaultMath.getValue(ethDiff, usdcDiff, osqthDiff, prices[0], prices[1]);
        console.log("accrude fee in USD %s", (feeValue * prices[0]) / 1e36);
    });
});
