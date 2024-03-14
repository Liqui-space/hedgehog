const { BigNumber } = require("ethers");
const { hardhatInitializedDeploy, deployContract } = require("@shared/deploy");
const {
    _deployerAddress,
    usdcAddress,
    osqthAddress,
    wethAddress,
    _oneClickWithdrawAddress,
} = require("@shared/constants");
const { resetFork, impersontate, getETH, getERC20Balance } = require("../helpers");
const { executeTx, getContract } = require("../helpers/components");
const { utils } = require("ethers");

describe.only("Eth transfer instructions", function () {
    let deployer;
    it("Initial", async function () {
        await resetFork(19428300);
        [Vault, VaultAuction, VaultMath, VaultTreasury, VaultStorage, _arguments] = await hardhatInitializedDeploy();

        V3Mock = await deployContract("V3Helper", [], true);

        deployer = await impersontate(_deployerAddress);
        await getETH(deployer, utils.parseEther("10"));
    });

    let totalGas = utils.parseEther("0");
    it("Reconnect", async function () {
        uniswapMath = await VaultTreasury.uniswapMath();
        vault = await VaultTreasury.vault();
        auction = await VaultTreasury.auction();
        vaultMath = await VaultTreasury.vaultMath();
        vaultTreasury = await VaultTreasury.vaultTreasury();
        vaultStorage = await VaultTreasury.vaultStorage();

        console.log("> balances:", (await VaultMath.getTotalAmounts()).toString());

        receipt = await executeTx(
            VaultTreasury.connect(deployer).setComponents(
                uniswapMath,
                deployer.address,
                deployer.address,
                deployer.address,
                vaultTreasury,
                vaultStorage
            )
        );
        totalGas = totalGas.add(receipt.gasUsed);
    });

    it("Burn & Collect", async function () {
        receipt = await executeTx(
            VaultTreasury.connect(deployer).burn(
                "0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8",
                await VaultStorage.orderEthUsdcLower(),
                await VaultStorage.orderEthUsdcUpper(),
                await VaultTreasury.connect(deployer).positionLiquidityEthUsdc()
            )
        );
        totalGas = totalGas.add(receipt.gasUsed);

        receipt = await executeTx(
            VaultTreasury.connect(deployer).collect(
                "0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8",
                await VaultStorage.orderEthUsdcLower(),
                await VaultStorage.orderEthUsdcUpper()
            )
        );
        totalGas = totalGas.add(receipt.gasUsed);

        receipt = await executeTx(
            VaultTreasury.connect(deployer).burn(
                "0x82c427AdFDf2d245Ec51D8046b41c4ee87F0d29C",
                await VaultStorage.orderOsqthEthLower(),
                await VaultStorage.orderOsqthEthUpper(),
                await VaultTreasury.connect(deployer).positionLiquidityEthOsqth()
            )
        );
        totalGas = totalGas.add(receipt.gasUsed);

        receipt = await executeTx(
            VaultTreasury.connect(deployer).collect(
                "0x82c427AdFDf2d245Ec51D8046b41c4ee87F0d29C",
                await VaultStorage.orderOsqthEthLower(),
                await VaultStorage.orderOsqthEthUpper()
            )
        );
        totalGas = totalGas.add(receipt.gasUsed);
    });

    it("Swaps", async function () {
        const _usdc = await getERC20Balance(VaultTreasury.address, usdcAddress);
        const _osqth = await getERC20Balance(VaultTreasury.address, osqthAddress);

        receipt = await executeTx(VaultTreasury.connect(deployer).transfer(usdcAddress, V3Mock.address, _usdc));
        totalGas = totalGas.add(receipt.gasUsed);

        receipt = await executeTx(VaultTreasury.connect(deployer).transfer(osqthAddress, V3Mock.address, _osqth));
        totalGas = totalGas.add(receipt.gasUsed);

        receipt = await executeTx(V3Mock.swapUSDC_WETH(_usdc));
        // totalGas = totalGas.add(receipt.gasUsed);

        receipt = await executeTx(V3Mock.swapOSQTH_WETH(_osqth));
        // totalGas = totalGas.add(receipt.gasUsed);

        totalGas = totalGas.add(356000 * 2);

        const _weth = await getERC20Balance(V3Mock.address, wethAddress);

        receipt = await executeTx(V3Mock.transfer(wethAddress, VaultTreasury.address, _weth));
        totalGas = totalGas.add(receipt.gasUsed);
    });
    it("Returns components", async function () {
        receipt = await executeTx(
            VaultTreasury.connect(deployer).setComponents(
                uniswapMath,
                vault,
                auction,
                vaultMath,
                vaultTreasury,
                vaultStorage
            )
        );
        totalGas = totalGas.add(receipt.gasUsed);

        console.log("> balances:", (await VaultMath.getTotalAmounts()).toString());
        const [a, ,] = await VaultMath.getTotalAmounts();
        console.log("> ETH:", a / 1e18);

        console.log("Gas used:", 2485105);
        console.log("in USD:", (2485105 * 3865 * 58) / 1e9);
    });

    it("Could withdraw", async function () {
        const holder = await impersontate("0x6a6605C9bB1cF8de3a703A4D285677E3b822aaCd");
        await getETH(holder, utils.parseEther("10"));

        _hh = BigNumber.from(await getERC20Balance(holder, Vault.address));
        console.log("holder shares", _hh.toString());
        console.log("holder WETH", await getERC20Balance(holder, wethAddress));

        await executeTx(Vault.connect(holder).withdraw(_hh.div(2), "0", "0", "0"));

        _hh = BigNumber.from(await getERC20Balance(holder, Vault.address));
        console.log("holder shares", _hh.toString());
        console.log("holder WETH", await getERC20Balance(holder, wethAddress));
    });

    it("Could one click withdraw", async function () {
        const holder = await impersontate("0x6a6605C9bB1cF8de3a703A4D285677E3b822aaCd");
        await getETH(holder, utils.parseEther("10"));

        _hh = BigNumber.from(await getERC20Balance(holder, Vault.address));
        console.log("holder shares", _hh.toString());
        console.log("holder WETH", await getERC20Balance(holder, wethAddress));

        const OneClickWithdraw = await getContract("OneClickWithdraw", _oneClickWithdrawAddress);
        await executeTx(Vault.connect(holder).approve(OneClickWithdraw.address, _hh));
        await executeTx(OneClickWithdraw.connect(holder).withdraw(holder.address, _hh, 0, 0, 0));

        _hh = BigNumber.from(await getERC20Balance(holder, Vault.address));
        console.log("holder shares", _hh.toString());
        console.log("holder WETH", await getERC20Balance(holder, wethAddress));
    });
});
