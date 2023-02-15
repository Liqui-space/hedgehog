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

const hardhatPartialDeploy = async (
    governanceAddress,
    params = deploymentParams,
    keeperAddress = governance.address
) => {
    MyContract = await ethers.getContractFactory("Vault");
    const Vault = await MyContract.attach(_vaultAddress);
    MyContract = await ethers.getContractFactory("VaultTreasury");
    const VaultTreasury = await MyContract.attach(_vaultTreasuryAddress);

    const owner = await impersontate(await Vault.owner());
    await getETH(owner.address, utils.parseEther("20"));

    await network.provider.send("evm_setAutomine", [false]);

    const VaultAuction = await deployContract("VaultAuction", [], false);
    const VaultMath = await deployContract("VaultMath", [], false);

    params.push(governanceAddress);
    params.push(keeperAddress);
    const VaultStorage = await deployContract("VaultStorage", params, false);

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

    await network.provider.request({
        method: "evm_mine",
    });
    await network.provider.send("evm_setAutomine", [true]);

    // await logFaucet(VaultAuction.address);
    // console.log("arguments", arguments);

    await executeTx(Vault.connect(owner).setComponents(...arguments));
    await executeTx(VaultAuction.setComponents(...arguments));
    await executeTx(VaultMath.setComponents(...arguments));
    await executeTx(VaultTreasury.connect(owner).setComponents(...arguments));
    await executeTx(VaultStorage.setComponents(...arguments));

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

    const V3Helper = await deployContract("V3Helper", [], false);

    //-- Perepherals

    MyContract = await ethers.getContractFactory("OneClickDeposit");
    const OneClickDeposit = await MyContract.attach(_oneClickDepositAddress);

    MyContract = await ethers.getContractFactory("OneClickWithdraw");
    const OneClickWithdraw = await MyContract.attach(_oneClickWithdrawAddress);

    const owner = await impersontate(await OneClickDeposit.owner());
    await getETH(owner, ethers.utils.parseEther("2.5"));

    //? Change contracts in current oneclicks
    tx = await OneClickDeposit.connect(owner).setContracts(_Vault);
    await tx.wait();

    tx = await OneClickWithdraw.connect(owner).setContracts(_Vault);
    await tx.wait();

    //-- Rebalancers

    const Rebalancer = await deployContract("Rebalancer", [], false);
    tx = await Rebalancer.setParams(_VaultStorage);
    await tx.wait();

    tx = await Rebalancer.transferOwnership(rebalancer.address);
    await tx.wait();

    const RebalanceModule4 = await deployContract("Module2", [], false);
    tx = await RebalanceModule4.setContracts(_VaultAuction, _VaultMath, _VaultTreasury, _VaultStorage);
    await tx.wait();
    tx = await RebalanceModule4.transferOwnership(Rebalancer.address);
    await tx.wait();

    tx = await VaultStorage.connect(governance).setGovernance(Rebalancer.address);
    await tx.wait();

    tx = await VaultStorage.connect(keeper).setKeeper(Rebalancer.address);
    await tx.wait();

    return [V3Helper, OneClickDeposit, OneClickWithdraw, Rebalancer, undefined, undefined, undefined, RebalanceModule4];
};

module.exports = {
    hardhatPartialDeploy,
    hardhatGetPerepherals,
    hardhatInitializedDeploy,
    deploymentParams,
    hardhatDeploy,
};
