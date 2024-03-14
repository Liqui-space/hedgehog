const { ethers } = require("hardhat");

const { deployContract } = require("@shared/deploy");
const { nullAddress, wethAddress } = require("@shared/constants");
const { resetFork, mineSomeBlocks, getWETH, getERC20Balance } = require("../helpers");
const { shouldThrowErrorComponentVM, executeTx } = require("../helpers/components");
const { assert } = require("chai");
const { utils } = require("ethers");

const ERR_CODE = (() => {
    let callCount = 0;
    const fn = () => {
        callCount++;
        return `Error code ${callCount}: Should be error`;
    };
    return fn;
})();

describe("Rip test mainnet", function () {
    let Rip;
    it("Initial", async function () {
        await resetFork(18942139);
        [deployer, multisig, admin1, admin2, admin3, chad, multisigV2] = await ethers.getSigners();
        Rip = await deployContract("Rip", [multisig.address, admin1.address, admin2.address], true);
        await getWETH(utils.parseEther("1"), Rip);

        inface = new ethers.utils.Interface(["function transfer(address to, uint256 value)"]);
        dataOfTransferTransaction = inface.encodeFunctionData("transfer", [nullAddress, utils.parseEther("0.01")]);
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

        // multisig adds admin3
        await executeTx(Rip.connect(multisig).addOwner(admin3.address));
    });

    it("Could activate owner", async function () {
        assert(await Rip.isOwner(admin3.address), "Should be 0");

        // 3 activates himself
        await executeTx(Rip.connect(admin3).activateOwner(), "owner activation");

        // not an owner can't call
        await shouldThrowErrorComponentVM(
            Rip.connect(chad).executeCall(wethAddress, dataOfTransferTransaction),
            "Not an owner",
            ERR_CODE()
        );

        // 3 can't call before activation time
        await shouldThrowErrorComponentVM(
            Rip.connect(admin3).executeCall(wethAddress, dataOfTransferTransaction),
            "Not activated",
            ERR_CODE()
        );

        // multisig can call anytime
        await executeTx(Rip.connect(multisig).executeCall(wethAddress, dataOfTransferTransaction));

        await mineSomeBlocks((await Rip.timelockInBlocks()).toNumber());

        // 3 could call after activation time
        await executeTx(Rip.connect(admin3).executeCall(wethAddress, dataOfTransferTransaction), "succesful call");

        // 3 could transfer asset after activation time
        await executeTx(
            Rip.connect(admin3).transferAsset(wethAddress, admin2.address, utils.parseEther("0.01")),
            "transfer asset"
        );
    });

    it("Could deactivate owner", async function () {
        // 2 deactivates 3 (could do it anytime)
        await executeTx(Rip.connect(admin2).deactivateOwner(admin3.address), "deactivate owner");

        // 3 can't call after deactivation
        await shouldThrowErrorComponentVM(
            Rip.connect(admin3).executeCall(wethAddress, dataOfTransferTransaction),
            "Not activated",
            ERR_CODE()
        );

        // 1 can't change params
        await shouldThrowErrorComponentVM(Rip.connect(admin1).setTimelockInBlocks(10), "Not multisig", ERR_CODE());

        // multisig can change params
        await executeTx(Rip.connect(multisig).setTimelockInBlocks(10), "set timelock");
        const timeLockInBlocks = (await Rip.timelockInBlocks()).toNumber();
        assert(timeLockInBlocks == 10, "Should be 10");

        // 2 activate himself
        await executeTx(Rip.connect(admin2).activateOwner(), "owner activation");

        // 2 can't call before activation time
        await shouldThrowErrorComponentVM(
            Rip.connect(admin2).executeCall(wethAddress, dataOfTransferTransaction),
            "Not activated",
            ERR_CODE()
        );

        // jump to new activation time
        await mineSomeBlocks(timeLockInBlocks);

        // 2 could call after new activation time
        await executeTx(Rip.connect(admin2).executeCall(wethAddress, dataOfTransferTransaction), "succesful call");
    });

    it("Could remove owner", async function () {
        // 3 can't remove 2
        await shouldThrowErrorComponentVM(Rip.connect(admin3).removeOwner(admin2.address), "Not multisig", ERR_CODE());

        // multisig can remove 2
        await executeTx(Rip.connect(multisig).removeOwner(admin2.address), "remove owner");

        // 2 is removed so can't call even if it was activated before
        await shouldThrowErrorComponentVM(
            Rip.connect(admin2).executeCall(wethAddress, dataOfTransferTransaction),
            "Not an owner",
            ERR_CODE()
        );

        assert((await getERC20Balance(Rip, wethAddress)) == utils.parseEther("0.96"), "Should be 0.96");
    });

    it("Could change multisig", async function () {
        assert((await Rip.multisig()) == multisig.address, "Should be multisig");

        // nobody could change multisig exept of multisig
        await shouldThrowErrorComponentVM(
            Rip.connect(admin1).setMultisig(multisigV2.address),
            "Not multisig",
            ERR_CODE()
        );
        await shouldThrowErrorComponentVM(
            Rip.connect(chad).setMultisig(multisigV2.address),
            "Not multisig",
            ERR_CODE()
        );
        await shouldThrowErrorComponentVM(
            Rip.connect(deployer).setMultisig(multisigV2.address),
            "Not multisig",
            ERR_CODE()
        );
        await executeTx(Rip.connect(multisig).setMultisig(multisigV2.address), "change multisig");

        assert((await Rip.multisig()) == multisigV2.address, "Should be multisigV2");
    });
});
