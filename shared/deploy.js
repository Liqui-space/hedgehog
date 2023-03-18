const { ethers } = require("hardhat");
const { impersontate, getETH, logFaucet } = require("../test/helpers");
const { executeTx, getContract } = require("../test/helpers/components");
const { utils, BigNumber } = ethers;
const {
    _uniMathAddress,
    _vaultAddress,
    _vaultAuctionAddress,
    _vaultMathAddress,
    _vaultTreasuryAddress,
    _vaultStorageAddress,
    _cheapRebalancerOld,
    _oneClickDepositAddress,
    _oneClickWithdrawAddress,
    _rebalancer,
    nullAddress,
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

    return [Vault, VaultAuction, VaultMath, VaultTreasury, VaultStorage, arguments];
};

const hardhatGetPerepherals = async (governance, keeper, rebalancer, _arguments) => {
    const [, _Vault, _VaultAuction, _VaultMath, _VaultTreasury, _VaultStorage] = _arguments;

    const V3Helper = await deployContract("V3Helper", [], true);

    //-- Perepherals
    const OneClickDeposit = await getContract("OneClickDeposit", _oneClickDepositAddress);
    // const OneClickDeposit = await deployContract("OneClickDeposit", [], true);
    const OneClickWithdraw = await getContract("OneClickWithdraw", _oneClickWithdrawAddress);

    //-- Rebalancers

    const Rebalancer = await deployContract("Rebalancer", [], true);
    await executeTx(Rebalancer.transferOwnership(rebalancer.address));

    const RebalancerOld = await getContract("Rebalancer", _rebalancer);
    const owner = await impersontate(await RebalancerOld.owner());
    await getETH(owner, utils.parseEther("20"));

    inface = new ethers.utils.Interface(["function setGovernance(address to)"]);
    await executeTx(
        RebalancerOld.connect(owner).complexCall(
            _VaultStorage,
            inface.encodeFunctionData("setGovernance", [Rebalancer.address]),
            nullAddress,
            nullAddress,
            0
        )
    );

    inface = new ethers.utils.Interface(["function setKeeper(address to)"]);
    await executeTx(
        RebalancerOld.connect(owner).complexCall(
            _VaultStorage,
            inface.encodeFunctionData("setKeeper", [Rebalancer.address]),
            nullAddress,
            nullAddress,
            0
        )
    );

    const Module4 = await deployContract("Module3", [], true);
    await executeTx(Module4.transferOwnership(Rebalancer.address));

    return [V3Helper, OneClickDeposit, OneClickWithdraw, Rebalancer, undefined, undefined, undefined, Module4];
};

module.exports = {
    hardhatPartialDeploy,
    hardhatGetPerepherals,
    hardhatInitializedDeploy,
    deploymentParams,
    hardhatDeploy,
    deployContract,
};
