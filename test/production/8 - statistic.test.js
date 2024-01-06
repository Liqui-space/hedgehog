const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");
const {
    _vaultStorageAddress,
    _vaultMathAddress,
    _vaultTreasuryAddress,
    wethAddress,
    usdcAddress,
    osqthAddress,
} = require("@shared/constants");
const { resetFork, impersontate, getERC20Balance } = require("../helpers");

describe("Cheap Rebalancer test mainnet", function () {
    it("Initial", async function () {
        await resetFork(17914434);

        const account = await impersontate(_vaultMathAddress);

        VaultStorage = await (await ethers.getContractFactory("VaultStorage")).attach(_vaultStorageAddress);
        VaultTreasury = await (await ethers.getContractFactory("VaultTreasury")).attach(_vaultTreasuryAddress);
        VaultMath = await (await ethers.getContractFactory("VaultMath")).attach(_vaultMathAddress);

        console.log(await VaultStorage.orderEthUsdcLower());
        const [usdcAmount, amountWeth0] = await _getPositionAmounts(
            VaultTreasury,
            VaultStorage,
            account,
            "0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8",
            await VaultStorage.orderEthUsdcLower(),
            await VaultStorage.orderEthUsdcUpper()
        );

        const [amountWeth1, osqthAmount] = await _getPositionAmounts(
            VaultTreasury,
            VaultStorage,
            account,
            "0x82c427AdFDf2d245Ec51D8046b41c4ee87F0d29C",
            await VaultStorage.orderOsqthEthLower(),
            await VaultStorage.orderOsqthEthUpper()
        );

        const weth = await getERC20Balance(_vaultTreasuryAddress, wethAddress);
        const usdc = await getERC20Balance(_vaultTreasuryAddress, usdcAddress);
        const osqth = await getERC20Balance(_vaultTreasuryAddress, osqthAddress);
        const raw = {
            usdcAmount,
            amountWeth0,
            amountWeth1,
            osqthAmount,
            weth,
            usdc,
            osqth,
        };
        console.log(raw);
    });

    const _getPositionAmounts = async (VaultTreasury, VaultStorage, account, pool, tickLower, tickUpper) => {
        const [liquidity, , , tokensOwed0, tokensOwed1] = await VaultTreasury.connect(account).position(
            pool,
            tickLower,
            tickUpper
        );

        const [amount0, amount1] = await VaultTreasury.connect(account).amountsForLiquidity(
            pool,
            tickLower,
            tickUpper,
            liquidity
        );

        const oneMinusFee = BigNumber.from("1000000000000000000").sub(await VaultStorage.protocolFee());

        return [
            amount0.add(BigNumber.from(tokensOwed0).mul(oneMinusFee)),
            amount1.add(BigNumber.from(tokensOwed1).mul(oneMinusFee)),
        ];
    };
});
