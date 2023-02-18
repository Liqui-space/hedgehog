const { assert } = require("chai");
const { ethers } = require("hardhat");
const { resetFork } = require("../helpers");
const { hardhatPartialDeploy } = require("@shared/deploy");

const { shouldThrowErrorComponent, executeTx } = require("../helpers/components");

describe("Governance check", function () {
    it("Should set actors", async function () {
        [, governance, depositor1, governance2] = await ethers.getSigners();
    });

    let Vault, VaultAuction, VaultMath, VaultTreasury, VaultStorage, tx;
    it("Should deploy contract", async function () {
        await resetFork(16634147);

        [Vault, VaultAuction, VaultMath, VaultTreasury, VaultStorage, _arguments] = await hardhatPartialDeploy(
            governance.address
        );
    });

    it("check", async function () {
        assert((await VaultStorage.cap()).toString() == "228000000000000000000");
        await shouldThrowErrorComponent(
            executeTx(VaultStorage.connect(depositor1).setCap("228000000000000000001")),
            "C15",
            "This should fail"
        );

        await executeTx(VaultStorage.connect(governance).setCap("228000000000000000001"));
        assert((await VaultStorage.cap()).toString() == "228000000000000000001");
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
            executeTx(VaultStorage.connect(governance).setCap("228000000000000000002")),
            "C15",
            "This should fail"
        );

        await executeTx(VaultStorage.connect(governance2).setCap("228000000000000000002"));
        assert((await VaultStorage.cap()).toString() == "228000000000000000002");
    });
});
