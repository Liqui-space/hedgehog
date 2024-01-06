const { ethers } = require("hardhat");

const { deployContract } = require("@shared/deploy");
const { nullAddress } = require("@shared/constants");
const { resetFork, mineSomeBlocks } = require("../helpers");

const { depositOCComponent, shouldThrowErrorComponent, executeTx } = require("../helpers/components");
const { assert } = require("chai");

describe.only("Rip test mainnet", function () {
    let Rip;
    it("Initial", async function () {
        await resetFork(18942139);
        [deployer, multisig, admin1, admin2, admin3, chad] = await ethers.getSigners();
        Rip = await deployContract("Rip", [multisig.address, admin1.address, admin2.address], true);
    });

    it("Could add delegate", async function () {
        await shouldThrowErrorComponent(
            Rip.connect(deployer).addDelegate(admin3.address),
            "VM Exception while processing transaction: reverted with reason string 'Not multisig'",
            "Should be error"
        );
        await shouldThrowErrorComponent(
            Rip.connect(chad).addDelegate(admin3.address),
            "VM Exception while processing transaction: reverted with reason string 'Not multisig'",
            "Should be error"
        );
        await shouldThrowErrorComponent(
            Rip.connect(admin1).addDelegate(admin3.address),
            "VM Exception while processing transaction: reverted with reason string 'Not multisig'",
            "Should be error"
        );
        await shouldThrowErrorComponent(
            Rip.connect(multisig).addDelegate(admin1.address),
            "VM Exception while processing transaction: reverted with reason string 'Delegate already exists'",
            "Should be error"
        );

        await executeTx(Rip.connect(multisig).addDelegate(admin3.address));
    });

    it("Could activate delegate", async function () {
        assert((await Rip.delegates(admin3.address)).activationBlock == 0, "Should be 0");

        await executeTx(Rip.connect(admin3).activateDelegate(), "delegate activation");

        await shouldThrowErrorComponent(
            Rip.connect(multisig).executeCall(nullAddress, "0x"),
            "VM Exception while processing transaction: reverted with reason string 'Not a delegate'",
            "Should be error"
        );
        await shouldThrowErrorComponent(
            Rip.connect(admin3).executeCall(nullAddress, "0x"),
            "VM Exception while processing transaction: reverted with reason string 'Not activated'",
            "Should be error"
        );

        await mineSomeBlocks((await Rip.timelockInBlocks()).toNumber());

        await executeTx(Rip.connect(admin3).executeCall(nullAddress, "0x"), "succesful call");
    });

    it("Could deactivate delegate", async function () {
        await executeTx(Rip.connect(admin2).deactivateDelegate(admin3.address), "deactivate delegate");

        await shouldThrowErrorComponent(
            Rip.connect(admin3).executeCall(nullAddress, "0x"),
            "VM Exception while processing transaction: reverted with reason string 'Not activated'",
            "Should be error"
        );

        await shouldThrowErrorComponent(
            Rip.connect(admin1).setTimelockInBlocks(10),
            "VM Exception while processing transaction: reverted with reason string 'Not multisig'",
            "Should be error"
        );

        await executeTx(Rip.connect(multisig).setTimelockInBlocks(10), "set timelock");

        const timeLockInBlocks = (await Rip.timelockInBlocks()).toNumber();
        assert(timeLockInBlocks == 10, "Should be 10");

        await executeTx(Rip.connect(admin2).activateDelegate(), "delegate activation");

        await shouldThrowErrorComponent(
            Rip.connect(admin2).executeCall(nullAddress, "0x"),
            "VM Exception while processing transaction: reverted with reason string 'Not activated'",
            "Should be error"
        );

        await mineSomeBlocks(timeLockInBlocks);

        await executeTx(Rip.connect(admin2).executeCall(nullAddress, "0x"), "succesful call");
    });

    it("Could remove delegate", async function () {
        await shouldThrowErrorComponent(
            Rip.connect(admin3).removeDelegate(admin2.address),
            "VM Exception while processing transaction: reverted with reason string 'Not multisig'",
            "Should be error"
        );

        await executeTx(Rip.connect(multisig).removeDelegate(admin2.address), "remove delegate");

        await shouldThrowErrorComponent(
            Rip.connect(admin2).executeCall(nullAddress, "0x"),
            "VM Exception while processing transaction: reverted with reason string 'Not a delegate'",
            "Should be error"
        );
    });
});
