const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const { utils } = ethers;
const {
    wethAddress,
    osqthAddress,
    usdcAddress,
    _biggestOSqthHolder,
    _vaultAuctionAddressHardhat,
    _vaultMathAddressHardhat,
} = require("@shared/constants");
const {
    mineSomeBlocks,
    resetFork,
    logBlock,
    getAndApprove2,
    getERC20Balance,
    getWETH,
    getOSQTH,
    getUSDC,
} = require("../helpers");
const { hardhatDeploy, deploymentParams } = require("@shared/deploy");
const { BigNumber } = require("ethers");

//TODO: change this to cheep rebalance with all 6 branches tested
describe.skip("Test of Rebalance in different market conditions", function () {
    let swaper, depositor1, depositor2, depositor3, keeper, governance, swapAmount;
    it("Should set actors", async function () {
        const signers = await ethers.getSigners();
        governance = signers[0];
        depositor1 = signers[7];
        keeper = signers[8];
        swaper = signers[9];
        depositor2 = signers[10];
        depositor3 = signers[11];
    });

    let Vault, VaultAuction, VaultMath, VaultTreasury, VaultStorage, tx;
    it("Should deploy contract", async function () {
        await resetFork(15173789);

        const params = [...deploymentParams];
        deploymentParams[6] = "10000";
        [Vault, VaultAuction, VaultMath, VaultTreasury, VaultStorage] = await hardhatDeploy(governance, params);
        await logBlock();

        const ContractHelper = await ethers.getContractFactory("V3Helper");
        contractHelper = await ContractHelper.deploy();
        await contractHelper.deployed();
    });

    const presets = {
        depositor1: {
            wethInput: "19987318809022169042",
            usdcInput: "15374822619",
            osqthInput: "113434930214010428403",
        },
        depositor2: {
            wethInput: "29987318809025550465",
            usdcInput: "23067111298",
            osqthInput: "170188380388050211783",
        },
        depositor3: {
            wethInput: "25443723573225622250",
            usdcInput: "11532228170",
            osqthInput: "194008074778513958331",
        },
        keeper: {
            wethInput: BigNumber.from("46420453093069060030").add(BigNumber.from("7611641957027153635")).toString(),
            usdcInput: BigNumber.from("35170786530").add(BigNumber.from("6086663569")).toString(),
            osqthInput: BigNumber.from("226662623566831825098").add(BigNumber.from("38536032101104376335")).toString(),
        },
    };
    it("preset", async function () {
        await getAndApprove2(
            keeper,
            VaultAuction.address,
            presets.keeper.wethInput,
            presets.keeper.usdcInput,
            presets.keeper.osqthInput
        );
        await getAndApprove2(
            depositor1,
            Vault.address,
            presets.depositor1.wethInput,
            presets.depositor1.usdcInput,
            presets.depositor1.osqthInput
        );
        await getAndApprove2(
            depositor2,
            Vault.address,
            presets.depositor2.wethInput,
            presets.depositor2.usdcInput,
            presets.depositor2.osqthInput
        );
        await getAndApprove2(
            depositor3,
            Vault.address,
            presets.depositor3.wethInput,
            presets.depositor3.usdcInput,
            presets.depositor3.osqthInput
        );
    });

    it("deposit1", async function () {
        tx = await Vault.connect(depositor1).deposit(
            "17630456391863397407",
            "29892919002",
            "33072912443025954753",
            depositor1.address,
            "0",
            "0",
            "0"
        );
        await tx.wait();

        // State
        const userEthBalanceAfterDeposit = await getERC20Balance(depositor1.address, wethAddress);
        const userUsdcBalanceAfterDeposit = await getERC20Balance(depositor1.address, usdcAddress);
        const userOsqthBalanceAfterDeposit = await getERC20Balance(depositor1.address, osqthAddress);
        const userShareAfterDeposit = await getERC20Balance(depositor1.address, Vault.address);

        console.log("> userEthBalanceAfterDeposit %s", userEthBalanceAfterDeposit);
        console.log("> userUsdcBalanceAfterDeposit %s", userUsdcBalanceAfterDeposit);
        console.log("> userOsqthBalanceAfterDeposit %s", userOsqthBalanceAfterDeposit);
        console.log("> userShareAfterDeposit", userShareAfterDeposit);
    });

    it("withdraw1 -> No liquidity", async function () {
        await expect(Vault.connect(depositor1).withdraw("19974637618044338084", "0", "0", "0")).to.be.revertedWith(
            "C6"
        );
    });

    it("deposit2", async function () {
        const amountDeposit = await Vault.calcSharesAndAmounts("59974637618044338084", "0", "0", "0", "false");

        console.log(
            "> ETH to deposit %s,USDC to deposit %s, oSQTH to deposit %s",
            amountDeposit[1],
            amountDeposit[2],
            amountDeposit[3]
        );

        tx = await Vault.connect(depositor2).deposit(
            "37630456391863397407",
            "29892919002",
            "33072912443025954753",
            depositor2.address,
            "0",
            "0",
            "0"
        );
        await tx.wait();

        // State
        const userEthBalanceAfterDeposit = await getERC20Balance(depositor2.address, wethAddress);
        const userUsdcBalanceAfterDeposit = await getERC20Balance(depositor2.address, usdcAddress);
        const userOsqthBalanceAfterDeposit = await getERC20Balance(depositor2.address, osqthAddress);
        const userShareAfterDeposit = await getERC20Balance(depositor2.address, Vault.address);

        console.log("> userEthBalanceAfterDeposit %s", userEthBalanceAfterDeposit);
        console.log("> userUsdcBalanceAfterDeposit %s", userUsdcBalanceAfterDeposit);
        console.log("> userOsqthBalanceAfterDeposit %s", userOsqthBalanceAfterDeposit);
        console.log("> userShareAfterDeposit", userShareAfterDeposit);
    });

    it("swap", async function () {
        await mineSomeBlocks(2216);

        swapAmount = utils.parseUnits("100", 18).toString();
        await getWETH(swapAmount, contractHelper.address);
        console.log("> WETH before swap:", await getERC20Balance(contractHelper.address, wethAddress));
        console.log("> USDC before swap:", await getERC20Balance(contractHelper.address, usdcAddress));
        tx = await contractHelper.connect(swaper).swapWETH_USDC(swapAmount);
        await tx.wait();
        console.log("> WETH after swap:", await getERC20Balance(contractHelper.address, wethAddress));
        console.log("> USDC after swap:", await getERC20Balance(contractHelper.address, usdcAddress));

        await mineSomeBlocks(554);

        swapAmount = utils.parseUnits("40", 18).toString();
        await getOSQTH(swapAmount, contractHelper.address, _biggestOSqthHolder);
        console.log("> OSQTH before swap:", await getERC20Balance(contractHelper.address, osqthAddress));
        console.log("> WETH before swap:", await getERC20Balance(contractHelper.address, wethAddress));
        tx = await contractHelper.connect(swaper).swapOSQTH_WETH(swapAmount);
        await tx.wait();
        console.log("> OSQTH before swap:", await getERC20Balance(contractHelper.address, osqthAddress));
        console.log("> WETH before swap:", await getERC20Balance(contractHelper.address, wethAddress));

        await mineSomeBlocks(40301);
    });

    it("rebalance iterative with real rebalance", async function () {
        this.skip();
        const log = {};
        const Rebalancer = await ethers.getContractFactory("Rebalancer");
        rebalancer = await Rebalancer.deploy();
        await rebalancer.deployed();

        tx = await rebalancer.setContracts(_vaultAuctionAddressHardhat, _vaultMathAddressHardhat);

        // await mineSomeBlocks(600);

        let succeded = false;
        for (let i = 0; i <= 10; i++) {
            console.log("Iteration:", i);
            try {
                const arbTx = await rebalancer.rebalance("0");
                await arbTx.wait();
                succeded = true;
            } catch (err) {
                if (err.message == `VM Exception while processing transaction: reverted with reason string 'STF'`) {
                    log[i] = "STF";
                    console.error("STF");
                }
                if (err.message == `VM Exception while processing transaction: reverted with reason string 'Success'`) {
                    console.error("Success");
                    succeded = true;
                    log[i] = "Success";
                } else {
                    console.error(err.message);
                    log[i] = err.message;
                }
            }

            await mineSomeBlocks(120);
        }
        assert(succeded, "No successful test found");
        console.log(log);
    }).timeout(1000000);

    it("rebalance with flash loan", async function () {
        // this.skip();
        const Rebalancer = await ethers.getContractFactory("BigRebalancer");
        rebalancer = await Rebalancer.deploy();
        await rebalancer.deployed();

        tx = await rebalancer.setContracts(
            "0x9Fcca440F19c62CDF7f973eB6DDF218B15d4C71D",
            "0x01E21d7B8c39dc4C764c19b308Bd8b14B1ba139E"
        );
        await tx.wait();

        await mineSomeBlocks(800);
        //await mineSomeBlocks(83069);

        console.log("> rebalancer ETH %s", await getERC20Balance(rebalancer.address, wethAddress));
        console.log("> rebalancer USDC %s", await getERC20Balance(rebalancer.address, usdcAddress));
        console.log("> rebalancer oSQTH %s", await getERC20Balance(rebalancer.address, osqthAddress));

        const arbTx = await rebalancer.rebalance(0);
        receipt = await arbTx.wait();
        console.log("> Gas used rebalance + fl: %s", receipt.gasUsed);

        const ethBalance = await getERC20Balance(rebalancer.address, wethAddress);
        console.log("> arb profit ETH %s", ethBalance);
        expect(await getERC20Balance(rebalancer.address, usdcAddress)).to.equal("0");
        expect(await getERC20Balance(rebalancer.address, osqthAddress)).to.equal("0");

        await rebalancer.collectProtocol(ethBalance, 0, 0, governance.address);
        await arbTx.wait();

        expect(await getERC20Balance(rebalancer.address, wethAddress)).to.equal("0");
        expect(await getERC20Balance(rebalancer.address, usdcAddress)).to.equal("0");
        expect(await getERC20Balance(rebalancer.address, osqthAddress)).to.equal("0");
    });

    it("rebalance iterative", async function () {
        this.skip();
        const testHolder = {};
        const MockRebalancer = await ethers.getContractFactory("MockRebalancer");
        mockRebalancer = await MockRebalancer.deploy();
        await mockRebalancer.deployed();

        await mineSomeBlocks(83069);

        for (let i = 0; i < 60; i++) {
            const ts = await mockRebalancer.poke();
            await ts.wait();
            const res = (await mockRebalancer.rebalance()).toString();
            if (!testHolder[res]) testHolder[res] = 0;
            testHolder[res]++;
            await mineSomeBlocks(10);
        }
        console.log(testHolder);
    }).timeout(1000000);
});
