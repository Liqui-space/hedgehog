const { ethers } = require("hardhat");

const { deployContract } = require("@shared/deploy");
const { nullAddress, wethAddress } = require("@shared/constants");
const { resetFork, mineSomeBlocks, getWETH, getERC20Balance } = require("../helpers");

const { shouldThrowErrorComponent, executeTx } = require("../helpers/components");
const { assert } = require("chai");
const { utils } = require("ethers");

describe.only("Rip test mainnet", function () {
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
            Rip.connect(multisig).executeCall(wethAddress, data),
            "VM Exception while processing transaction: reverted with reason string 'Not a delegate'",
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

    it("Could deactivate delegate", async function () {
        await executeTx(Rip.connect(admin2).deactivateDelegate(admin3.address), "deactivate delegate");

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

        await executeTx(Rip.connect(admin2).activateDelegate(), "delegate activation");

        await shouldThrowErrorComponent(
            Rip.connect(admin2).executeCall(wethAddress, data),
            "VM Exception while processing transaction: reverted with reason string 'Not activated'",
            "Should be error"
        );

        await mineSomeBlocks(timeLockInBlocks);

        await executeTx(Rip.connect(admin2).executeCall(wethAddress, data), "succesful call");
    });

    it("Could remove delegate", async function () {
        await shouldThrowErrorComponent(
            Rip.connect(admin3).removeDelegate(admin2.address),
            "VM Exception while processing transaction: reverted with reason string 'Not multisig'",
            "Should be error"
        );

        await executeTx(Rip.connect(multisig).removeDelegate(admin2.address), "remove delegate");

        await shouldThrowErrorComponent(
            Rip.connect(admin2).executeCall(wethAddress, data),
            "VM Exception while processing transaction: reverted with reason string 'Not a delegate'",
            "Should be error"
        );

        assert((await getERC20Balance(Rip, wethAddress)) == utils.parseEther("0.98"), "Should be 0.98");
    });
});
