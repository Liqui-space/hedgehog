process.exit(0); // Block file in order to not accidentally deploy

const { ethers } = require("hardhat");
const { utils } = ethers;
const { BigNumber } = require("ethers");

const {
    _uniMathAddress,
    _deployerAddress,
    usdcAddress,
    _vaultAddress,
    _vaultTreasuryAddress,
    _vaultAuctionAddressV2,
    _vaultMathAddressV2,
    _vaultStorageAddressV2,
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
    //     _vaultAddress, //
    //     _vaultAuctionAddressV2, //
    //     _vaultMathAddressV2, //
    //     _vaultTreasuryAddress, //
    //     _vaultStorageAddressV2, //
    // ];
    // IFaucet = await ethers.getContractFactory("Faucet");
    // const Faucet = await IFaucet.attach(_vaultAddress);
    // tx = await Faucet.setComponents(...newContracts, {
    //     // gasLimit: 1000000,
    // });
    // console.log(tx);
};

hardhatDeployContractsPartial().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
