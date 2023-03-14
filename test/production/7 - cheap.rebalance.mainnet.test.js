const { ethers } = require("hardhat");
const { _cheapRebalancerOld, _bigRebalancerEuler2, _vaultStorageAddressV2 } = require("@shared/constants");
const { resetFork, getETH, impersontate } = require("../helpers");
const { executeTx } = require("../helpers/components");

describe.skip("Cheap Rebalancer test mainnet", function () {
    it("Initial", async function () {
        await resetFork(16797970);

        CheapRebalancerOld = await ethers.getContractAt("ICheapRebalancerOld", _cheapRebalancerOld);
        ModuleOld = await ethers.getContractAt("IModuleOld", _bigRebalancerEuler2);
        VaultStorage = await (await ethers.getContractFactory("VaultStorage")).attach(_vaultStorageAddressV2);

        const _owner = await CheapRebalancerOld.owner();
        owner = await impersontate(_owner);
        await getETH(owner, ethers.utils.parseEther("3.0"));
    });

    it("Configure", async function () {
        // this.skip();

        await executeTx(CheapRebalancerOld.connect(owner).returnGovernance(owner.address));
        await executeTx(VaultStorage.connect(owner).setIrMax(0));
        await executeTx(VaultStorage.connect(owner).setGovernance(CheapRebalancerOld.address));
    });

    it("rebalance", async function () {
        // this.skip();

        const _owner = await CheapRebalancerOld.owner();
        owner = await impersontate(_owner);
        await getETH(owner, ethers.utils.parseEther("30.0"));

        await executeTx(CheapRebalancerOld.connect(owner).rebalance("0", "950000000000000000"));
    });
});
