const { assert } = require("chai");
const { ethers } = require("hardhat");
const { resetFork, logBlock } = require("../helpers");
const { hardhatDeploy, deploymentParams, hardhatGetPerepherals } = require("@shared/deploy");

const {
    depositOCComponent,
    withdrawComponent,
    shouldThrowErrorComponent,
    swapComponent,
    executeTx,
} = require("../helpers/components");

describe.only("Governance check", function () {
    it("Should set actors", async function () {
        [owner, governance, rebalancer, depositor1, keeper, swaper, depositor2, depositor3, governance2] =
            await ethers.getSigners();
    });

    let Vault, VaultAuction, VaultMath, VaultTreasury, VaultStorage, tx;
    it("Should deploy contract", async function () {
        await resetFork(16586904);

        [Vault, VaultAuction, VaultMath, VaultTreasury, VaultStorage, _arguments] = await hardhatDeploy(
            governance.address
        );
    });

    it("check", async function () {
        assert((await VaultStorage.cap()).toString() == "100000000000000000000");
        await shouldThrowErrorComponent(
            executeTx(VaultStorage.connect(depositor1).setCap("100000000000000000001")),
            "C15",
            "This should fail"
        );

        await executeTx(VaultStorage.connect(governance).setCap("100000000000000000001"));
        assert((await VaultStorage.cap()).toString() == "100000000000000000001");
    });

    it("setGov", async function () {
        await shouldThrowErrorComponent(
            executeTx(VaultStorage.connect(depositor1).setGovernance(governance2.address)),
            "C15",
            "This should fail"
        );

        await executeTx(VaultStorage.connect(governance).setGovernance(governance2.address));

        await shouldThrowErrorComponent(
            executeTx(VaultStorage.connect(governance).setGovernance(governance2.address)),
            "C15",
            "This should fail"
        );
    });

    it("check", async function () {
        await shouldThrowErrorComponent(
            executeTx(VaultStorage.connect(governance).setCap("100000000000000000002")),
            "C15",
            "This should fail"
        );

        await executeTx(VaultStorage.connect(governance2).setCap("100000000000000000002"));
        assert((await VaultStorage.cap()).toString() == "100000000000000000002");
    });
});
