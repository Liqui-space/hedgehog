const { ethers } = require("hardhat");
const { _vaultStorageAddress } = require("@shared/constants");
const { resetFork, getETH, impersontate, logFaucet } = require("../helpers");
const { executeTx } = require("../helpers/components");
const { _rebalanceModule4, nullAddress, _rebalancer, _vaultMathAddress } = require("../../shared/constants");

describe.only("Cheap Rebalancer test mainnet", function () {
    it("Initial", async function () {
        await resetFork(16854063);

        Rebalancer = await (await ethers.getContractFactory("Rebalancer")).attach(_rebalancer);
        VaultStorage = await (await ethers.getContractFactory("VaultStorage")).attach(_vaultStorageAddress);
        VaultMath = await (await ethers.getContractFactory("VaultMath")).attach(_vaultMathAddress);

        await logFaucet;
    });

    it("rebalance", async function () {
        // this.skip();
        console.log("ir %s", await VaultMath.getInterestRate());

        const _owner = await Rebalancer.owner();
        owner = await impersontate(_owner);
        await getETH(owner, ethers.utils.parseEther("3.0"));

        inface = new ethers.utils.Interface(["function rebalance(uint256 threshold, uint256 triggerTime)"]);
        await executeTx(
            Rebalancer.connect(owner).complexCall(
                _rebalanceModule4,
                inface.encodeFunctionData("rebalance", [0, ethers.utils.parseUnits("103", 16).toString()]),
                nullAddress,
                _rebalanceModule4,
                "993000000000000000"
            ),
            "new cheap Rebalance",
            true
        );
    });
});
