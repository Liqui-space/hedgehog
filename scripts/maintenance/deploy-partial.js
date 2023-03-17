// process.exit(0); // Block file in order to not accidentally deploy

const { ethers } = require("hardhat");
const { utils } = ethers;
const { BigNumber } = require("ethers");

const {
    _uniMathAddress,
    _deployerAddress,
    usdcAddress,
    _vaultAddress,
    _vaultMathAddressV3,
    _vaultTreasuryAddress,
    _vaultAuctionAddressV2,
    _vaultMathAddressV2,
    _cheapRebalancerOld,
    _vaultStorageAddressV2,
    _bigRebalancerEuler,
    _bigRebalancerEuler2,
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
    //     _vaultAuctionAddressV2, //
    //     _vaultMathAddressV3, //
    //     _vaultTreasuryAddress, //
    //     _vaultStorageAddressV2, //
    // ];
    // IFaucet = await ethers.getContractFactory("Faucet");
    // const Faucet = await IFaucet.attach(_vaultAddress);
    // tx = await Faucet.setComponents(...newContracts);
    // ModuleOld = await ethers.getContractAt("IModuleOld", _bigRebalancerEuler2);
    // console.log((await ModuleOld.addressAuction()) == _vaultAuctionAddressV2);
    // console.log((await ModuleOld.addressMath()) == _vaultMathAddressV2);
    // console.log((await ModuleOld.addressTreasury()) == _vaultTreasuryAddress);
    // console.log((await ModuleOld.addressStorage()) == _vaultStorageAddressV2);
    // tx = await ModuleOld.callStatic.setContracts(
    //     _vaultAuctionAddressV2,
    //     _vaultMathAddressV2,
    //     _vaultTreasuryAddress,
    //     _vaultStorageAddressV2
    // );
    // tx = await ModuleOld.transferOwnership(_cheapRebalancerOld);
    // console.log(tx);
    // #1
    // const Rebalancer = await deployContract("Rebalancer", [], false);
    // console.log(Rebalancer);
    //#2
    // transfer ownerhip from Cheap to module
    // keeper from module to Reb
    // gov from Cheap to Reb
    // ownership from rebelnce deployer to multisig
};

hardhatDeployContractsPartial().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
