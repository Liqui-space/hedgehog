// process.exit(0); // Block file in order to not accidentally deploy

const { utils } = require("ethers");
const { ethers } = require("hardhat");
const {
    _cheapRebalancer,
    _vaultTreasuryAddress,
    _hedgehogPeripheralsDeployer,
    wethAddress,
    _rebalanceModule2,
    _rebalanceModule3,
    _rebalanceModule,
    _vaultStorageAddress,
    _sharedGovernance,
} = require("../../shared/constants");

let tx, CheapRebalancer, WETH;
const operation = async () => {
    MyContract = await ethers.getContractFactory("CheapRebalancer");
    CheapRebalancer = await MyContract.attach(_cheapRebalancer);
    WETH = await ethers.getContractAt("IWETH", wethAddress);
    MyContract = await ethers.getContractFactory("VaultStorage");
    VaultStorage = await MyContract.attach(_vaultStorageAddress);
    MyContract = await ethers.getContractFactory("BigRebalancerEuler");
    BigRebalancerEuler = await MyContract.attach(_rebalanceModule2);
    MyContract = await ethers.getContractFactory("BigRebalancerEuler");
    BigRebalancerEuler2 = await MyContract.attach(_rebalanceModule3);
    MyContract = await ethers.getContractFactory("BigRebalancer");
    BigRebalancer = await MyContract.attach(_rebalanceModule);

    console.log(await VaultStorage.owner());
    console.log(await CheapRebalancer.owner());
    // await governanceOperations();
    await rebalanceOperations();
    // await collectToTreasuryOperations();
    // await collectToAddress();
    // await rebalanceManipulations();
    // await rebalanceManipulations2();
    // await rebalanceManipulations3();

    if (tx) console.log(tx);
};

const rebalanceManipulations = async () => {
    const gasPrice = 26 * 10 ** 9;

    // tx = await BigRebalancer.callStatic.transferOwnership(CheapRebalancer.address, {
    //     gasLimit: 2000000,
    //     gasPrice,
    // });

    // tx = await CheapRebalancer.callStatic.returnOwner(_hedgehogPeripheralsDeployer, {
    //     gasLimit: 2000000,
    //     gasPrice,
    // });

    // tx = await BigRebalancerEuler.callStatic.setKeeper(BigRebalancer.address, {
    //     gasLimit: 2000000,
    //     gasPrice,
    // });

    // tx = await CheapRebalancer.callStatic.setContracts(BigRebalancer.address, {
    //     gasLimit: 2000000,
    //     gasPrice,
    // });
};

const rebalanceManipulations2 = async () => {
    const gasPrice = 28 * 10 ** 9;

    // tx = await CheapRebalancer.callStatic.returnOwner(_hedgehogPeripheralsDeployer, {
    //     gasLimit: 2000000,
    //     gasPrice,
    // });

    // tx = await BigRebalancer.callStatic.setKeeper(BigRebalancerEuler.address, {
    //     gasLimit: 2000000,
    //     gasPrice,
    // });

    // tx = await CheapRebalancer.callStatic.setContracts(BigRebalancerEuler.address, {
    //     gasLimit: 2000000,
    //     gasPrice,
    // });

    // tx = await BigRebalancerEuler.callStatic.transferOwnership(CheapRebalancer.address, {
    //     gasLimit: 2000000,
    //     gasPrice,
    // });
};

const rebalanceManipulations3 = async () => {
    const gasPrice = 24 * 10 ** 9;

    // tx = await CheapRebalancer.callStatic.returnOwner(_hedgehogPeripheralsDeployer, {
    //     gasLimit: 2000000,
    //     gasPrice,
    // });

    // tx = await BigRebalancer.callStatic.setKeeper(BigRebalancerEuler2.address, {
    //     gasLimit: 2000000,
    //     gasPrice,
    // });

    // tx = await CheapRebalancer.callStatic.setContracts(BigRebalancerEuler2.address, {
    //     gasLimit: 2000000,
    //     gasPrice,
    // });

    // tx = await BigRebalancerEuler2.callStatic.transferOwnership(CheapRebalancer.address, {
    //     gasLimit: 2000000,
    //     gasPrice,
    // });
};

const governanceOperations = async () => {
    const gasPrice = 16 * 10 ** 9;
    // console.log(await CheapRebalancer.bigRebalancer());
    // tx = await CheapRebalancer.returnGovernance(_hedgehogPeripheralsDeployer, {
    //     gasLimit: 80000,
    //     gasPrice,
    // });
    // tx = await CheapRebalancer.callStatic.transferOwnership(_sharedGovernance, {
    //     gasLimit: 80000,
    //     gasPrice,
    // });
    // console.log(await VaultStorage.governance());
    // tx = await VaultStorage.callStatic.setBaseThreshold(1500, {
    //     gasLimit: 80000,
    //     gasPrice,
    // });
    // tx = await VaultStorage.callStatic.setCap("228000000000000000000", {
    //     gasLimit: 80000,
    //     gasPrice,
    // });
    // tx = await VaultStorage.callStatic.setGovernance(_cheapRebalancer, {
    //     gasLimit: 80000,
    //     gasPrice,
    // });
};

const rebalanceOperations = async () => {
    let amount = await WETH.balanceOf(_rebalanceModule);
    console.log("Total before", amount.toString());

    // const mul = "1100000000000000000";
    // const mul = "1000000000000000000";
    // const mul = "999900000000000000";
    // const mul = "999600000000000000";
    // const mul = "999000000000000000";
    // const mul = "998500000000000000";
    // const mul = "998000000000000000";
    // const mul = "997500000000000000";
    // const mul = "997000000000000000";
    // const mul = "995000000000000000";
    // const mul = "990000000000000000";
    // const mul = "950000000000000000";
    tx = await CheapRebalancer.callStatic.rebalance("0", mul, {
        gasLimit: 4000000,
        gasPrice: 25 * 10 ** 9,
    });
};

const collectToTreasuryOperations = async () => {
    const contract = await CheapRebalancer.bigRebalancer();
    let amount = await WETH.balanceOf(contract);
    console.log("Total", amount.toString());

    // let partToSend = "102284313101702060";
    // let partToSend = utils.parseUnits("0.2", 18);
    let partToSend = amount.mul(2).div(3);
    console.log("Send ", partToSend.toString());

    tx = await CheapRebalancer.callStatic.collectProtocol(partToSend, "0", "0", _vaultTreasuryAddress, {
        gasLimit: 80000,
        gasPrice: 18 * 10 ** 9,
    });
};

const collectToAddress = async () => {
    // console.log(await CheapRebalancer.bigRebalancer());
    // tx = await CheapRebalancer.setContracts(_rebalanceModule3, {
    //     gasLimit: 80000,
    //     gasPrice: 31 * 10 ** 9,
    // });
    // const contract = await CheapRebalancer.bigRebalancer();
    // let amount = await WETH.balanceOf(contract);
    // console.log("All", amount.toString());
    // tx = await CheapRebalancer.collectProtocol(amount, "0", "0", _hedgehogPeripheralsDeployer, {
    //     gasLimit: 80000,
    //     gasPrice: 29 * 10 ** 9,
    // });
};

operation().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
