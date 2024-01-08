const { ethers } = require("hardhat");

const { deployContract } = require("@shared/deploy");
const { nullAddress, wethAddress } = require("@shared/constants");
const { resetFork, mineSomeBlocks, getWETH, getERC20Balance } = require("../helpers");

const { shouldThrowErrorComponent, executeTx } = require("../helpers/components");
const { assert } = require("chai");
const { utils } = require("ethers");

describe("Rip test mainnet", function () {
    let Rip;
    it("Initial", async function () {
        await resetFork(18942139);
        [deployer, multisig, admin1, admin2, admin3, chad] = await ethers.getSigners();
        Rip = await deployContract("Rip", [multisig.address, admin1.address, admin2.address], true);
        await getWETH(utils.parseEther("1"), Rip);

        inface = new ethers.utils.Interface(["function transfer(address to, uint256 value)"]);
        data = inface.encodeFunctionData("transfer", [nullAddress, utils.parseEther("0.01")]);
        assert((await getERC20Balance(Rip, wethAddress)) == utils.parseEther("1"), "Should be 1");
    });

    it("Could add owner", async function () {
        await shouldThrowErrorComponent(
            Rip.connect(deployer).addOwner(admin3.address),
            "VM Exception while processing transaction: reverted with reason string 'Not multisig'",
            "Should be error"
        );
        await shouldThrowErrorComponent(
            Rip.connect(chad).addOwner(admin3.address),
            "VM Exception while processing transaction: reverted with reason string 'Not multisig'",
            "Should be error"
        );
        await shouldThrowErrorComponent(
            Rip.connect(admin1).addOwner(admin3.address),
            "VM Exception while processing transaction: reverted with reason string 'Not multisig'",
            "Should be error"
        );
        await shouldThrowErrorComponent(
            Rip.connect(multisig).addOwner(admin1.address),
            "VM Exception while processing transaction: reverted with reason string 'Owner already exists'",
            "Should be error"
        );

        await executeTx(Rip.connect(multisig).addOwner(admin3.address));
    });

    it("Could activate owner", async function () {
        assert((await Rip.owners(admin3.address)).activationBlock == 0, "Should be 0");

        await executeTx(Rip.connect(admin3).activateOwner(), "owner activation");

        await shouldThrowErrorComponent(
            Rip.connect(multisig).executeCall(wethAddress, data),
            "VM Exception while processing transaction: reverted with reason string 'Not a owner'",
            "Should be error"
        );
        await shouldThrowErrorComponent(
            Rip.connect(admin3).executeCall(wethAddress, data),
            "VM Exception while processing transaction: reverted with reason string 'Not activated'",
            "Should be error"
        );

        await mineSomeBlocks((await Rip.timelockInBlocks()).toNumber());

        await executeTx(Rip.connect(admin3).executeCall(wethAddress, data), "succesful call");
    });

    it("Could deactivate owner", async function () {
        await executeTx(Rip.connect(admin2).deactivateOwner(admin3.address), "deactivate owner");

        await shouldThrowErrorComponent(
            Rip.connect(admin3).executeCall(wethAddress, data),
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

        await executeTx(Rip.connect(admin2).activateOwner(), "owner activation");

        await shouldThrowErrorComponent(
            Rip.connect(admin2).executeCall(wethAddress, data),
            "VM Exception while processing transaction: reverted with reason string 'Not activated'",
            "Should be error"
        );

        await mineSomeBlocks(timeLockInBlocks);

        await executeTx(Rip.connect(admin2).executeCall(wethAddress, data), "succesful call");
    });

    it("Could remove owner", async function () {
        await shouldThrowErrorComponent(
            Rip.connect(admin3).removeOwner(admin2.address),
            "VM Exception while processing transaction: reverted with reason string 'Not multisig'",
            "Should be error"
        );

        await executeTx(Rip.connect(multisig).removeOwner(admin2.address), "remove owner");

        await shouldThrowErrorComponent(
            Rip.connect(admin2).executeCall(wethAddress, data),
            "VM Exception while processing transaction: reverted with reason string 'Not a owner'",
            "Should be error"
        );

        assert((await getERC20Balance(Rip, wethAddress)) == utils.parseEther("0.98"), "Should be 0.98");
    });
});
