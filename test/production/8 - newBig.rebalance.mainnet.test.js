const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const { utils } = ethers;
const {
    _rescueAddress,
    _rebalancerAddress,
    _rebalancerBigAddress,
    _governanceAddress,
    _vaultAuctionAddress,
    _vaultMathAddress,
    _vaultStorageAddress,
    _rebalanceModule,
    _hedgehogPeripheralsDeployer,
    _vaultTreasuryAddress,
    _cheapRebalancer,
} = require("@shared/constants");
const {
    mineSomeBlocks,
    resetFork,
    getERC20Balance,
    getUSDC,
    getOSQTH,
    getWETH,
    logBlock,
    getERC20Allowance,
    approveERC20,
    logBalance,
    getETH,
} = require("../helpers");
const { deployContract } = require("@shared/deploy");

describe
    .skip("Cheap Rebalancer test mainnet", function () {
        it("Phase 0", async function () {
            await resetFork(16421755);

            await hre.network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [_hedgehogPeripheralsDeployer],
            });

            hedgehogRebalancerActor = await ethers.getSigner(_hedgehogPeripheralsDeployer);

            await getETH(hedgehogRebalancerActor.address, ethers.utils.parseEther("3.0"));
        });

        it("Deploy and setup", async function () {
            // this.skip();
            MyContract = await ethers.getContractFactory("VaultStorage");
            VaultStorage = await MyContract.attach(_vaultStorageAddress);

            MyContract = await ethers.getContractFactory("BigRebalancer");
            BigRebalancer = await MyContract.attach(_rebalanceModule);

            MyContract = await ethers.getContractFactory("CheapRebalancer");
            CheapRebalancer = await MyContract.attach(_cheapRebalancer);

            //? Configure

            tx = await CheapRebalancer.connect(hedgehogRebalancerActor).returnOwner(hedgehogRebalancerActor.address);
            await tx.wait();

            BigRebalancerEuler = await deployContract("BigRebalancerEuler", [], false);
            tx = await BigRebalancerEuler.transferOwnership(CheapRebalancer.address);
            await tx.wait();

            tx = await BigRebalancer.connect(hedgehogRebalancerActor).setKeeper(BigRebalancerEuler.address);
            await tx.wait();

            tx = await CheapRebalancer.connect(hedgehogRebalancerActor).setContracts(BigRebalancerEuler.address);
            await tx.wait();

            // //? Check

            console.log("CheapRebalancer.owner:", (await CheapRebalancer.owner()) == hedgehogRebalancerActor.address);
            console.log("BigRebalancerEuler.owner:", (await BigRebalancerEuler.owner()) == CheapRebalancer.address);
            console.log("BigRebalancer.owner:", (await BigRebalancer.owner()) == hedgehogRebalancerActor.address);
            console.log("VaultStorage.governance:", (await VaultStorage.governance()) == CheapRebalancer.address);
            console.log("VaultStorage.keeper:", (await VaultStorage.keeper()) == BigRebalancerEuler.address);
        });

        it("Phase Do rebalance", async function () {
            // this.skip();
            await logBalance(_vaultTreasuryAddress, "Treasury before");
            await logBalance(BigRebalancerEuler.address, "BigRebalancerEuler before");
            await logBalance(hedgehogRebalancerActor.address, "hedgehogRebalancerActor.address before");

            tx = await CheapRebalancer.connect(hedgehogRebalancerActor).rebalance("0", "998000000000000000");
            recipt = await tx.wait();
            console.log("Gas used", recipt.gasUsed.toString());

            await logBalance(_vaultTreasuryAddress, "Treasury after");
            await logBalance(BigRebalancerEuler.address, "BigRebalancerEuler after");
        });

        return;
        it("Check transfers", async function () {
            this.skip();
            tx = await CheapRebalancer.connect(hedgehogRebalancerActor).returnOwner(_hedgehogPeripheralsDeployer);
            await tx.wait();

            tx = await CheapRebalancer.connect(hedgehogRebalancerActor).returnGovernance(_governanceAddress);
            await tx.wait();

            console.log("Rebalancer.owner:", await Rebalancer.owner());
            console.log("VaultStorage.governance:", await VaultStorage.governance());
        });
    })
    .timeout(10000000);
