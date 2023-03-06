const { ethers } = require("hardhat");
const {
    _cheapRebalancerOld,
    _vaultStorageAddress,
    _rebalanceModule,
    _bigRebalancerEuler,
    _bigRebalancerEuler2,
    _vaultTreasuryAddress,
    _vaultAuctionAddress,
    _vaultAuctionAddressV2,
    _vaultMathAddressV2,
    _vaultStorageAddressV2,
    _cheapRebalancer,
} = require("@shared/constants");
const { resetFork, logBalance, getETH, impersontate } = require("../helpers");
const { executeTx } = require("../helpers/components");
const { deployContract } = require("@shared/deploy");

describe.only("Cheap Rebalancer test mainnet", function () {
    it("Initial", async function () {
        await resetFork(16770815);

        CheapRebalancerOld = await ethers.getContractAt("ICheapRebalancerOld", _cheapRebalancerOld);
        ModuleOld = await ethers.getContractAt("IModuleOld", _bigRebalancerEuler2);

        const _owner = await ModuleOld.owner();
        console.log(_owner);

        owner = await impersontate(_owner);
        await getETH(owner, ethers.utils.parseEther("3.0"));
    });

    it("Configure", async function () {
        this.skip();
        // await executeTx(
        //     ModuleOld.connect(owner).setContracts(
        //         _vaultAuctionAddressV2,
        //         _vaultMathAddressV2,
        //         _vaultTreasuryAddress,
        //         _vaultStorageAddressV2
        //     )
        // );
        // await executeTx(ModuleOld.connect(owner).transferOwnership(CheapRebalancerOld.address));
        // console.log((await CheapRebalancerOld.bigRebalancer()) == _bigRebalancerEuler2);
        // console.log((await ModuleOld.addressAuction()) == _vaultAuctionAddressV2);
        // console.log(await ModuleOld.owner());
        // console.log(ModuleOld.address == _bigRebalancerEuler2);
    });

    it("rebalance", async function () {
        // this.skip();

        const _owner = await CheapRebalancerOld.owner();
        owner = await impersontate(_owner);
        await getETH(owner, ethers.utils.parseEther("30.0"));

        await executeTx(CheapRebalancerOld.connect(owner).rebalance("0", "950000000000000000"));
    });
});
