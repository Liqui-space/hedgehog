const { ethers } = require("hardhat");
const { impersontate, getETH } = require("../test/helpers");
const { utils, BigNumber } = ethers;

const deployContract = async (name, params, deploy = true) => {
    console.log("Deploying ->", name);
    const Contract = await ethers.getContractFactory(name);
    let contract = await Contract.deploy(...params);
    if (deploy) {
        await contract.deployed();
    }
    return contract;
};

const {
    _vaultAddress,
    _vaultAuctionAddress,
    _vaultMathAddress,
    _vaultTreasuryAddress,
    _vaultStorageAddress,
    _rebalanceModule1,
    _rebalanceModule2,
    _rebalanceModule3,
    _cheapRebalancerOld,
    _oneClickDepositAddress,
    _oneClickWithdrawAddress,
} = require("./constants");

const deploymentParams = [
    utils.parseUnits("100", 18),
    BigNumber.from(43200),
    utils.parseUnits("0.1", 18),
    BigNumber.from("1200"),
    BigNumber.from("950000000000000000"),
    BigNumber.from("1050000000000000000"),
    BigNumber.from("0"),
];

const hardhatDeploy = async (governanceAddress, params = deploymentParams, keeperAddress = governance.address) => {
    await network.provider.send("evm_setAutomine", [false]);

    const UniswapMath = await deployContract("UniswapMath", [], false);

    const Vault = await deployContract("Vault", [], false);
    const VaultAuction = await deployContract("VaultAuction", [], false);
    const VaultMath = await deployContract("VaultMath", [], false);
    const VaultTreasury = await deployContract("VaultTreasury", [], false);

    params.push(governanceAddress);
    params.push(keeperAddress);
    const VaultStorage = await deployContract("VaultStorage", params, false);

    const arguments = [
        UniswapMath.address,
        Vault.address,
        VaultAuction.address,
        VaultMath.address,
        VaultTreasury.address,
        VaultStorage.address,
    ];

    console.log("> UniswapMath:", arguments[0]);
    console.log("> Vault:", arguments[1]);
    console.log("> VaultAuction:", arguments[2]);
    console.log("> VaultMath:", arguments[3]);
    console.log("> VaultTreasury:", arguments[4]);
    console.log("> VaultStorage:", arguments[5]);

    const OneClickDeposit = await deployContract("OneClickDeposit", [], false);
    const OneClickWithdraw = await deployContract("OneClickWithdraw", [], false);

    await network.provider.request({
        method: "evm_mine",
    });

    await Vault.setComponents(...arguments);
    await VaultAuction.setComponents(...arguments);
    await VaultMath.setComponents(...arguments);
    await VaultTreasury.setComponents(...arguments);
    await VaultStorage.setComponents(...arguments);

    await network.provider.request({
        method: "evm_mine",
    });
    await network.provider.send("evm_setAutomine", [true]);

    return [Vault, VaultAuction, VaultMath, VaultTreasury, VaultStorage];
};

const hardhatInitializedDeploy = async () => {
    let MyContract;

    //-- Core

    MyContract = await ethers.getContractFactory("Vault");
    const Vault = await MyContract.attach(_vaultAddress);

    MyContract = await ethers.getContractFactory("VaultAuction");
    const VaultAuction = await MyContract.attach(_vaultAuctionAddress);

    MyContract = await ethers.getContractFactory("VaultMath");
    const VaultMath = await MyContract.attach(_vaultMathAddress);

    MyContract = await ethers.getContractFactory("VaultTreasury");
    const VaultTreasury = await MyContract.attach(_vaultTreasuryAddress);

    MyContract = await ethers.getContractFactory("VaultStorage");
    const VaultStorage = await MyContract.attach(_vaultStorageAddress);

    return [Vault, VaultAuction, VaultMath, VaultTreasury, VaultStorage];
};

//? Now we will reuse HV2 Perepherals to the fullest, and change it to new one in the future
const hardhatGetPerepherals = async (vaultAddress, governance, keeper, rebalancer, VaultStorage) => {
    const V3Helper = await deployContract("V3Helper", [], false);

    //-- Perepherals

    MyContract = await ethers.getContractFactory("OneClickDeposit");
    const OneClickDeposit = await MyContract.attach(_oneClickDepositAddress);

    MyContract = await ethers.getContractFactory("OneClickWithdraw");
    const OneClickWithdraw = await MyContract.attach(_oneClickWithdrawAddress);

    const owner = await impersontate(await OneClickDeposit.owner());
    await getETH(owner, ethers.utils.parseEther("2.5"));

    // //? Change contracts in current oneclicks
    tx = await OneClickDeposit.connect(owner).setContracts(vaultAddress);
    await tx.wait();

    tx = await OneClickWithdraw.connect(owner).setContracts(vaultAddress);
    await tx.wait();

    //-- Rebalancers

    const Rebalancer = await deployContract("Rebalancer", [], false);
    tx = await Rebalancer.setParams(VaultStorage.address);
    await tx.wait();

    tx = await Rebalancer.transferOwnership(rebalancer.address);
    await tx.wait();

    MyContract = await ethers.getContractFactory("Module1");
    const RebalanceModule1 = await MyContract.attach(_rebalanceModule1);

    MyContract = await ethers.getContractFactory("Module2");
    const RebalanceModule2 = await MyContract.attach(_rebalanceModule2);

    MyContract = await ethers.getContractFactory("Module2");
    const RebalanceModule3 = await MyContract.attach(_rebalanceModule3);

    _CheapRebalancer = await ethers.getContractAt("ICheapRebalancerOld", _cheapRebalancerOld);

    const owner3 = await impersontate(await RebalanceModule1.owner());
    await getETH(owner3, ethers.utils.parseEther("2.5"));

    tx = await RebalanceModule1.connect(owner3).transferOwnership(Rebalancer.address);
    await tx.wait();

    const owner2 = await impersontate(await _CheapRebalancer.owner());
    await getETH(owner2, ethers.utils.parseEther("2.5"));

    tx = await _CheapRebalancer.connect(owner2).setContracts(RebalanceModule2.address);
    await tx.wait();
    tx = await _CheapRebalancer.connect(owner2).returnOwner(Rebalancer.address);
    await tx.wait();

    tx = await _CheapRebalancer.connect(owner2).setContracts(RebalanceModule3.address);
    await tx.wait();
    tx = await _CheapRebalancer.connect(owner2).returnOwner(Rebalancer.address);
    await tx.wait();

    tx = await VaultStorage.connect(governance).setGovernance(Rebalancer.address);
    await tx.wait();

    tx = await VaultStorage.connect(keeper).setKeeper(Rebalancer.address);
    await tx.wait();

    return [
        V3Helper,
        OneClickDeposit,
        OneClickWithdraw,
        Rebalancer,
        RebalanceModule1,
        RebalanceModule2,
        RebalanceModule3,
    ];
};

module.exports = {
    hardhatGetPerepherals,
    hardhatInitializedDeploy,
    deploymentParams,
    hardhatDeploy,
};
