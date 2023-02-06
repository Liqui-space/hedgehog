const { ethers } = require("hardhat");
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
    _cheapRebalancer,
    _rebalanceModule,
} = require("./constants");

const deploymentParams = [
    utils.parseUnits("100", 18),
    BigNumber.from(43200),
    utils.parseUnits("0.1", 18),
    BigNumber.from("1200"),
    BigNumber.from("950000000000000000"),
    BigNumber.from("1050000000000000000"),
    BigNumber.from("0"),
];;

const hardhatDeploy = async (governance, params, keeperAddress = governance.address) => {
    await network.provider.send("evm_setAutomine", [false]);

    const UniswapMath = await deployContract("UniswapMath", [], false);

    const Vault = await deployContract("Vault", [], false);
    const VaultAuction = await deployContract("VaultAuction", [], false);
    const VaultMath = await deployContract("VaultMath", [], false);
    const VaultTreasury = await deployContract("VaultTreasury", [], false);

    params.push(governance.address);
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
    {
        let tx;

        tx = await Vault.setComponents(...arguments);

        tx = await VaultAuction.setComponents(...arguments);

        tx = await VaultMath.setComponents(...arguments);

        tx = await VaultTreasury.setComponents(...arguments);

        tx = await VaultStorage.setComponents(...arguments);
    }
    await network.provider.request({
        method: "evm_mine",
    });
    await network.provider.send("evm_setAutomine", [true]);

    return [Vault, VaultAuction, VaultMath, VaultTreasury, VaultStorage];
};

const hardhatInitializeDeploed = async () => {

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
    
    //-- Rebalancers

    MyContract = await ethers.getContractFactory("CheapRebalancer");
    const CheapRebalancer = await MyContract.attach(_cheapRebalancer);

    MyContract = await ethers.getContractFactory("BigRebalancer");
    const RebalanceModule1 = await MyContract.attach(_rebalanceModule);

    //-- Perepherals

    return [
        Vault,
        VaultAuction,
        VaultMath,
        VaultTreasury,
        VaultStorage,
        CheapRebalancer,
        RebalanceModule1
    ]
};

module.exports = {     
    hardhatInitializeDeploed,
    deploymentParams,
    hardhatDeploy, 
};
