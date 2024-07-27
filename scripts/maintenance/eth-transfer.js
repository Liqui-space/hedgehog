process.exit(0); // Block file in order to not accidentally deploy

const { ethers } = require("hardhat");
const {
    _vaultTreasuryAddress,
    _deployerAddress,
    _vaultStorageAddress,
    _vaultAddress,
    usdcAddress,
    osqthAddress,
} = require("@shared/constants");
const { getERC20Balance } = require("../../test/helpers");

const hardhatInitializeContracts = async () => {
    const VaultTreasury = await ethers.getContractAt("VaultTreasury", _vaultTreasuryAddress);
    const VaultStorage = await ethers.getContractAt("VaultStorage", _vaultStorageAddress);
    const Vault = await ethers.getContractAt("Vault", _vaultAddress);

    // uniswapMath = await Vault.uniswapMath();
    // vault = await Vault.vault();
    // auction = await Vault.auction();
    // vaultMath = await Vault.vaultMath();
    // vaultTreasury = await Vault.vaultTreasury();
    // vaultStorage = await Vault.vaultStorage();

    // console.log("uniswapMath:", uniswapMath);
    // console.log("vault:", vault);
    // console.log("auction:", auction);
    // console.log("vaultMath:", vaultMath);
    // console.log("vaultTreasury:", vaultTreasury);
    // console.log("vaultStorage:", vaultStorage);

    // let tx;
    // tx = await VaultTreasury.setComponents(uniswapMath, vault, auction, vaultMath, vaultTreasury, vaultStorage, {
    //     gasLimit: 100000,
    //     // gasPrice: 44 * 10 ** 9,
    //     nonce: 58,
    // });

    // console.log(await VaultTreasury.positionLiquidityEthUsdc());
    // tx = await VaultTreasury.burn(
    //     "0x82c427AdFDf2d245Ec51D8046b41c4ee87F0d29C",
    //     await VaultStorage.orderOsqthEthLower(),
    //     await VaultStorage.orderOsqthEthUpper(),
    //     await VaultTreasury.positionLiquidityEthOsqth(),
    //     {
    //         gasPrice: 52 * 10 ** 9,
    //         gasLimit: 300000,
    //         nonce: 49,
    //     }
    // );

    // tx = await VaultTreasury.collect(
    //     "0x82c427AdFDf2d245Ec51D8046b41c4ee87F0d29C",
    //     await VaultStorage.orderOsqthEthLower(),
    //     await VaultStorage.orderOsqthEthUpper(),
    //     {
    //         gasPrice: 52 * 10 ** 9,
    //         gasLimit: 300000,
    //         nonce: 50,
    //     }
    // );

    // const _usdc = await getERC20Balance(VaultTreasury.address, usdcAddress);
    // const _osqth = await getERC20Balance(VaultTreasury.address, osqthAddress);
    // console.log(_osqth);

    // tx = await VaultTreasury.transfer(osqthAddress, _deployerAddress, _osqth, {
    //     gasPrice: 50 * 10 ** 9,
    //     gasLimit: 100000,
    //     nonce: 53,
    // });

    console.log(tx);
};

hardhatInitializeContracts().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
