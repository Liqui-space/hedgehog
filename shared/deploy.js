const { ethers } = require("hardhat");
const { impersontate, getETH, logFaucet } = require("../test/helpers");
const { executeTx } = require("../test/helpers/components");
const { utils, BigNumber } = ethers;
const {
    _uniMathAddress,
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
    _vaultAuctionAddress,
    _vaultStorageAddress,
} = require("./constants");

const deployContract = async (name, params, deploy = true) => {
    console.log("Deploying ->", name);
    const Contract = await ethers.getContractFactory(name);
    let contract = await Contract.deploy(...params);
    if (deploy) {
        await contract.deployed();
    }
    return contract;
};

const deploymentParams = [
    utils.parseUnits("228", 18),
    BigNumber.from(604800),
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

    return [Vault, VaultAuction, VaultMath, VaultTreasury, VaultStorage, arguments];
};

const hardhatPartialDeploy = async () => {
    MyContract = await ethers.getContractFactory("Vault");
    const Vault = await MyContract.attach(_vaultAddress);
    MyContract = await ethers.getContractFactory("VaultAuction");
    const VaultAuction = await MyContract.attach(_vaultAuctionAddress);
    MyContract = await ethers.getContractFactory("VaultTreasury");
    const VaultTreasury = await MyContract.attach(_vaultTreasuryAddress);
    MyContract = await ethers.getContractFactory("VaultStorage");
    const VaultStorage = await MyContract.attach(_vaultStorageAddress);

    const VaultMath = await deployContract("VaultMath", [], true);

    const arguments = [
        await Vault.uniswapMath(),
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

    // await logFaucet(VaultAuction.address);
    // console.log("arguments", arguments);

    const owner = await impersontate(await Vault.owner());
    await getETH(owner.address, utils.parseEther("20"));
    await executeTx(Vault.connect(owner).setComponents(...arguments));
    await executeTx(VaultAuction.connect(owner).setComponents(...arguments));
    await executeTx(VaultMath.setComponents(...arguments));
    await executeTx(VaultTreasury.connect(owner).setComponents(...arguments));
    await executeTx(VaultStorage.connect(owner).setComponents(...arguments));

    // await logFaucet(VaultTreasury.address);

    return [Vault, VaultAuction, VaultMath, VaultTreasury, VaultStorage, arguments];
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

    const arguments = [
        _uniMathAddress,
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

    return [Vault, VaultAuction, VaultMath, VaultTreasury, VaultStorage];
};

//? Now we will reuse HV2 Perepherals to the fullest, and change it to new one in the future
const hardhatGetPerepherals = async (governance, keeper, rebalancer, _arguments, VaultStorage) => {
    const [, _Vault, _VaultAuction, _VaultMath, _VaultTreasury, _VaultStorage] = _arguments;

    const V3Helper = await deployContract("V3Helper", [], true);

    //-- Perepherals

    // MyContract = await ethers.getContractFactory("OneClickDeposit");
    // const OneClickDeposit = await MyContract.attach(_oneClickDepositAddress);
    const OneClickDeposit = await deployContract("OneClickDeposit", [], true);

    MyContract = await ethers.getContractFactory("OneClickWithdraw");
    const OneClickWithdraw = await MyContract.attach(_oneClickWithdrawAddress);

    //-- Rebalancers

    const Rebalancer = await deployContract("Rebalancer", [], true);
    await executeTx(Rebalancer.transferOwnership(rebalancer.address));

    const CheapRebalancerOld = await ethers.getContractAt("ICheapRebalancerOld", _cheapRebalancerOld);
    const owner = await impersontate(await CheapRebalancerOld.owner());
    await getETH(owner.address, utils.parseEther("20"));
    await executeTx(CheapRebalancerOld.connect(owner).returnOwner(owner.address));
    const ModuleOld = await ethers.getContractAt("IModuleOld", await CheapRebalancerOld.bigRebalancer());

    const RebalanceModule4 = await deployContract("Module3", [], true);
    await executeTx(RebalanceModule4.setContracts(_VaultAuction, _VaultMath, _VaultTreasury, _VaultStorage));
    await executeTx(RebalanceModule4.transferOwnership(Rebalancer.address));

    await executeTx(ModuleOld.connect(owner).setKeeper(Rebalancer.address));

    await executeTx(CheapRebalancerOld.connect(owner).returnGovernance(Rebalancer.address));

    console.log("keeper", await VaultStorage.keeper());
    console.log("governance", await VaultStorage.governance());
    console.log("Rebalancer", Rebalancer.address);
    console.log("Module4", RebalanceModule4.address);

    return [V3Helper, OneClickDeposit, OneClickWithdraw, Rebalancer, undefined, undefined, undefined, RebalanceModule4];
};

module.exports = {
    hardhatPartialDeploy,
    hardhatGetPerepherals,
    hardhatInitializedDeploy,
    deploymentParams,
    hardhatDeploy,
    deployContract,
};
