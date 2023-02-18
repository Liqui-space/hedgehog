const { ethers } = require("hardhat");
const { wethAddress, usdcAddress } = require("@shared/constants");
const { resetFork } = require("../helpers");
const { hardhatPartialDeploy } = require("@shared/deploy");
const { executeTx, shouldThrowErrorComponent } = require("../helpers/components");
const abi = ethers.utils.defaultAbiCoder;

describe.only("V3 mint callback check access", function () {
    it("Should set actors", async function () {
        [, governance, unuthorized] = await ethers.getSigners();
    });

    let Vault, VaultAuction, VaultMath, VaultTreasury, VaultStorage, tx;
    it("Should deploy contract", async function () {
        await resetFork(16634147);

        [Vault, VaultAuction, VaultMath, VaultTreasury, VaultStorage] = await hardhatPartialDeploy(governance.address);
    });

    it("unuthorized test", async function () {
        const args = abi.encode(["address", "address", "address"], [unuthorized.address, wethAddress, usdcAddress]);

        await shouldThrowErrorComponent(
            executeTx(VaultTreasury.connect(unuthorized).uniswapV3MintCallback(1, 1, args)),
            "C20",
            "This should fail"
        );
    });
});
