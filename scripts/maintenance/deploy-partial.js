// process.exit(0); // Block file in order to not accidentally deploy

const { ethers } = require("hardhat");
const { utils } = ethers;
const { BigNumber } = require("ethers");

const {
    _uniMathAddress,
    _deployerAddress,
    usdcAddress,
    _vaultAddress,
    _vaultMathAddress,
    _vaultTreasuryAddress,
    _vaultAuctionAddress,
    _vaultMathAddress,
    _cheapRebalancerOld,
    _vaultStorageAddress,
    _rebalanceModule2,
    _rebalanceModule3,
    _rebalancer,
    _rebalanceModule4,
} = require("../../shared/constants");
const { deployContract, deploymentParams } = require("../../shared/deploy");

const hardhatDeployContractsPartial = async () => {
    // const VaultAuction = await deployContract("VaultAuction", [], false);
    // const VaultMath = await deployContract("VaultMath", [], false);
    // console.log(VaultMath);
    // return;
    // MyContract = await ethers.getContractFactory("ERC20");
    // const Token = await MyContract.attach(usdcAddress);
    // tx = await Token.approve(_uniMathAddress, "1", {
    //     gasLimit: 1000000,
    //     nonce: 21,
    // });
    // console.log(tx);
    // deploymentParams.push("0x17e8a3e01A73c754052cdCdee29E5804300c5406");
    // deploymentParams.push("0xfE08EEb4d98551Ea6eB474b24356a82Cf60277e2");
    // console.log(deploymentParams);
    // const VaultStorage = await deployContract("VaultStorage", deploymentParams, false);
    // console.log(VaultStorage);
    // const newContracts = [
    //     _uniMathAddress,
    //     _vaultAddress,
    //     _vaultAuctionAddress, //
    //     _vaultMathAddress, //
    //     _vaultTreasuryAddress, //
    //     _vaultStorageAddress, //
    // ];
    // IFaucet = await ethers.getContractFactory("Faucet");
    // const Faucet = await IFaucet.attach(_vaultAddress);
    // tx = await Faucet.setComponents(...newContracts);
    ModuleOld = await ethers.getContractAt("IModuleOld", _rebalanceModule4);
    console.log((await ModuleOld.addressAuction()) == _vaultAuctionAddress);
    console.log((await ModuleOld.addressMath()) == _vaultMathAddress);
    console.log((await ModuleOld.addressTreasury()) == _vaultTreasuryAddress);
    console.log((await ModuleOld.addressStorage()) == _vaultStorageAddress);
    // tx = await ModuleOld.callStatic.setContracts(
    //     _vaultAuctionAddress,
    //     _vaultMathAddress,
    //     _vaultTreasuryAddress,
    //     _vaultStorageAddress
    // );
    // tx = await ModuleOld.transferOwnership(_cheapRebalancerOld);
    // console.log(tx);
    // #1
    // const Rebalancer = await deployContract("Rebalancer", [], false);
    // console.log(Rebalancer);
    //#2

    // CheapRebalancerOld = await ethers.getContractAt("ICheapRebalancerOld", _cheapRebalancerOld);

    // const Faucet = await (await ethers.getContractFactory("VaultStorage")).attach(_vaultStorageAddress);

    // console.log(await Faucet.governance());
    // console.log(await CheapRebalancerOld.bigRebalancer());
    // transfer ownerhip from Cheap to module
    // keeper from module to Reb
    // gov from Cheap to Reb
    // ownership from rebelnce deployer to multisig

    // return;
    const Rebalancer = await (await ethers.getContractFactory("Rebalancer")).attach(_rebalancer);
    // Check

    inface = new ethers.utils.Interface(["function rebalance(uint256 threshold, uint256 triggerTime)"]);
    data = inface.encodeFunctionData("rebalance", [0, ethers.utils.parseUnits("103", 16).toString()]);

    //
    tx = await Rebalancer.callStatic.complexCall(
        _rebalanceModule4,
        data,
        "0x0000000000000000000000000000000000000000",
        _rebalanceModule4,
        "991000000000000000"
    );
    console.log(tx);
};

hardhatDeployContractsPartial().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
