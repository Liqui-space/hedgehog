const { assert } = require("chai");
const { ethers } = require("hardhat");
const { resetFork, logBlock } = require("../helpers");
const { hardhatDeploy, deploymentParams } = require("@shared/deploy");

describe.skip("Governance check", function () {
    let swaper, depositor1, depositor2, depositor3, keeper, governance, swapAmount;
    it("Should set actors", async function () {
        const signers = await ethers.getSigners();
        governance = signers[0];
        depositor1 = signers[7];
        keeper = signers[8];
        swaper = signers[9];
        depositor2 = signers[10];
        depositor3 = signers[11];
        governance2 = signers[12];
    });

    let Vault, VaultAuction, VaultMath, VaultTreasury, VaultStorage, tx;
    it("Should deploy contract", async function () {
        await resetFork(15173789);

        const params = [...deploymentParams];
        deploymentParams[6] = "10000";
        [Vault, VaultAuction, VaultMath, VaultTreasury, VaultStorage] = await hardhatDeploy(governance, params);
        await logBlock();

        const ContractHelper = await ethers.getContractFactory("V3Helper");
        contractHelper = await ContractHelper.deploy();
        await contractHelper.deployed();
    });

    it("check", async function () {
        let cap = await VaultStorage.cap();
        assert(cap.toString() == "100000000000000000000");

        let errored = false;
        try {
            tx = await VaultStorage.connect(depositor1).setCap("100000000000000000001");
            await tx.wait();
        } catch (err) {
            if (err.message == `VM Exception while processing transaction: reverted with reason string 'C15'`)
                errored = true;
            else console.log(err.message);
        }
        assert(errored);

        tx = await VaultStorage.connect(governance).setCap("100000000000000000001");
        await tx.wait();

        cap = await VaultStorage.cap();
        assert(cap.toString() == "100000000000000000001");
    });

    it("setGov", async function () {
        let errored = false;
        try {
            tx = await VaultStorage.connect(depositor1).setGovernance(governance2.address);
            await tx.wait();
        } catch (err) {
            if (err.message == `VM Exception while processing transaction: reverted with reason string 'C15'`)
                errored = true;
            else console.log(err.message);
        }
        assert(errored);

        tx = await VaultStorage.connect(governance).setGovernance(governance2.address);
        await tx.wait();

        errored = false;
        try {
            tx = await VaultStorage.connect(governance).setGovernance(governance2.address);
            await tx.wait();
        } catch (err) {
            if (err.message == `VM Exception while processing transaction: reverted with reason string 'C15'`)
                errored = true;
            else console.log(err.message);
        }
        assert(errored);
    });

    it("check", async function () {
        let errored = false;
        try {
            tx = await VaultStorage.connect(governance).setCap("100000000000000000002");
            await tx.wait();
        } catch (err) {
            if (err.message == `VM Exception while processing transaction: reverted with reason string 'C15'`)
                errored = true;
            else console.log(err.message);
        }
        assert(errored);

        tx = await VaultStorage.connect(governance2).setCap("100000000000000000002");
        await tx.wait();

        cap = await VaultStorage.cap();
        assert(cap.toString() == "100000000000000000002");
    });
});
