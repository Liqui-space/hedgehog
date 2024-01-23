const { ethers } = require("hardhat");

const { deployContract } = require("@shared/deploy");
const { nullAddress, wethAddress } = require("@shared/constants");
const { resetFork, mineSomeBlocks, getWETH, getERC20Balance } = require("../helpers");

const { shouldThrowErrorComponentVM, executeTx } = require("../helpers/components");
const { assert } = require("chai");
const { utils } = require("ethers");

const ERR_CODE = (() => {
    let callCount = 0; // Initialize counter
    const fn = () => {
        callCount++; // Increment on each call
        return `Error code ${callCount}: Should be error`;
    };
    return fn;
})();

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

    it("Could add owner", async function () {
        await shouldThrowErrorComponentVM(Rip.connect(deployer).addOwner(admin3.address), "Not multisig", ERR_CODE());
        await shouldThrowErrorComponentVM(Rip.connect(chad).addOwner(admin3.address), "Not multisig", ERR_CODE());
        await shouldThrowErrorComponentVM(Rip.connect(admin1).addOwner(admin3.address), "Not multisig", ERR_CODE());
        await shouldThrowErrorComponentVM(
            Rip.connect(multisig).addOwner(admin1.address),
            "Owner already exists",
            ERR_CODE()
        );

        await executeTx(Rip.connect(multisig).addOwner(admin3.address));
    });

    it("Could activate owner", async function () {
        assert(await Rip.isOwner(admin3.address), "Should be 0");

        await executeTx(Rip.connect(admin3).activateOwner(), "owner activation");

        await shouldThrowErrorComponentVM(
            Rip.connect(multisig).executeCall(wethAddress, data),
            "Not an owner",
            ERR_CODE()
        );
        await shouldThrowErrorComponentVM(
            Rip.connect(admin3).executeCall(wethAddress, data),
            "Not activated",
            ERR_CODE()
        );

        await mineSomeBlocks((await Rip.timelockInBlocks()).toNumber());

        // Testing execute call and transferAsset function
        await executeTx(Rip.connect(admin3).executeCall(wethAddress, data), "succesful call");
        await executeTx(
            Rip.connect(admin3).transferAsset(wethAddress, admin2.address, utils.parseEther("0.01")),
            "transfer asset"
        );
    });

    it("Could deactivate owner", async function () {
        await executeTx(Rip.connect(admin2).deactivateOwner(admin3.address), "deactivate owner");

        await shouldThrowErrorComponentVM(
            Rip.connect(admin3).executeCall(wethAddress, data),
            "Not activated",
            ERR_CODE()
        );

        await shouldThrowErrorComponentVM(Rip.connect(admin1).setTimelockInBlocks(10), "Not multisig", ERR_CODE());

        await executeTx(Rip.connect(multisig).setTimelockInBlocks(10), "set timelock");

        const timeLockInBlocks = (await Rip.timelockInBlocks()).toNumber();
        assert(timeLockInBlocks == 10, "Should be 10");

        await executeTx(Rip.connect(admin2).activateOwner(), "owner activation");

        await shouldThrowErrorComponentVM(
            Rip.connect(admin2).executeCall(wethAddress, data),
            "Not activated",
            ERR_CODE()
        );

        await mineSomeBlocks(timeLockInBlocks);

        await executeTx(Rip.connect(admin2).executeCall(wethAddress, data), "succesful call");
    });

    it("Could remove owner", async function () {
        await shouldThrowErrorComponentVM(Rip.connect(admin3).removeOwner(admin2.address), "Not multisig", ERR_CODE());

        await executeTx(Rip.connect(multisig).removeOwner(admin2.address), "remove owner");

        await shouldThrowErrorComponentVM(
            Rip.connect(admin2).executeCall(wethAddress, data),
            "Not an owner",
            ERR_CODE()
        );

        assert((await getERC20Balance(Rip, wethAddress)) == utils.parseEther("0.97"), "Should be 0.97");
    });
});
