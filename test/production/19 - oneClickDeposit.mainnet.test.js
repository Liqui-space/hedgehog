const { ethers } = require("hardhat");
const { utils } = ethers;
const { expect, assert } = require("chai");
const {
    wethAddress,
    osqthAddress,
    usdcAddress,
    _oneClickDepositAddress,
    _cheapRebalancer,
    maxUint256,
    _hedgehogPeripheralsDeployer,
} = require("@shared/constants");
const {
    resetFork,
    getERC20Balance,
    getERC20Allowance,
    getWETH,
    logBalance,
    getETH,
    mineSomeBlocks,
} = require("../helpers");
const { BigNumber } = require("ethers");

describe.skip("One Click deposit Mainnet", function () {
    let tx, receipt, OneClickDeposit;
    let actor;
    let actorAddress = _hedgehogPeripheralsDeployer;

    it("Should set actors", async function () {
        await resetFork(15940465);

        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [actorAddress],
        });

        actor = await ethers.getSigner(actorAddress);
        console.log("actor:", actor.address);

        await getETH(actorAddress, ethers.utils.parseEther("20.0"));

        MyContract = await ethers.getContractFactory("OneClickDeposit");
        OneClickDeposit = await MyContract.attach(_oneClickDepositAddress);

        // MyContract = await ethers.getContractFactory("OneClickDeposit");
        // OneClickDeposit = await MyContract.deploy();
        // await OneClickDeposit.deployed();

        MyContract = await ethers.getContractFactory("CheapRebalancer");
        CheapRebalancer = await MyContract.attach(_cheapRebalancer);

        tx = await CheapRebalancer.connect(actor).rebalance("0", "995000000000000000");
        await tx.wait();

        // MyContract = await ethers.getContractFactory("VaultAuction");
        // VaultAuction = await MyContract.attach(_vaultAuctionAddress);
        // tx = await VaultAuction.connect(actor).timeRebalance(_hedgehogPeripheralsDeployer, "0", "0", "0");
        // await tx.wait();
    });

    it("flash deposit real (mode = 0)", async function () {
        // this.skip();

        // await approveERC20(actor, OneClickDeposit.address, ethers.utils.parseEther("1"), wethAddress);
        // await getWETH(ethers.utils.parseEther("4.0"), actorAddress);

        await mineSomeBlocks(20);

        await logBalance(actorAddress, "> actorAddress");

        // let WETH = await ethers.getContractAt("IWETH", wethAddress);
        // tx = await WETH.connect(actor).approve(OneClickDeposit.address, BigNumber.from(maxUint256));
        // await tx.wait();

        await logBalance(OneClickDeposit.address, "> Contract");

        const slippage = "995000000000000000";
        const amountETH = ethers.utils.parseEther("0.01");

        console.log("> amount wETH to deposit %s", amountETH);
        console.log(
            "> allowa wETH to deposit %s",
            await getERC20Allowance(actorAddress, OneClickDeposit.address, wethAddress)
        );

        tx = await OneClickDeposit.connect(actor).deposit(amountETH, slippage, actorAddress, "0", {
            gasLimit: 2700000,
            gasPrice: 26 * 10 ** 9,
        });

        receipt = await tx.wait();
        console.log("> deposit()");
        console.log("> Gas used: %s", receipt.gasUsed);

        await logBalance(actorAddress, "> actorAddress");
    });

    it("flash deposit real (mode = 1)", async function () {
        this.skip();
        // const oneClickDepositAddress = _oneClickDepositAddress;
        const oneClickDepositAddress = OneClickDeposit.address;

        const [owner] = await ethers.getSigners();
        await owner.sendTransaction({
            to: actorAddress,
            value: ethers.utils.parseEther("10.0"), // Sends exactly 1.0 ether
        });

        let WETH = await ethers.getContractAt("IWETH", wethAddress);
        tx = await WETH.connect(actor).approve(oneClickDepositAddress, BigNumber.from(maxUint256));
        await tx.wait();
        await getWETH(utils.parseUnits("20", 18), actor.address);
        console.log("> user Eth %s", await getERC20Balance(actor.address, wethAddress));

        console.log("> Contract Eth balance %s", await getERC20Balance(oneClickDepositAddress, wethAddress));
        console.log("> Contract Usdc balance %s", await getERC20Balance(oneClickDepositAddress, usdcAddress));
        console.log("> Contract Osqth balance %s", await getERC20Balance(oneClickDepositAddress, osqthAddress));

        const slippage = "990000000000000000";
        const amountETH = "10000000000000000000";

        console.log("> amount wETH to deposit %s", await getERC20Balance(actor.address, wethAddress));

        tx = await OneClickDeposit.connect(actor).deposit(amountETH, slippage, actorAddress, "1", {
            gasLimit: 1500000,
            gasPrice: 8000000000,
        });

        receipt = await tx.wait();
        console.log("> deposit()");
        console.log("> Gas used: %s", receipt.gasUsed);

        console.log("> user Eth %s", await getERC20Balance(actor.address, wethAddress));
        console.log("> user Usdc %s", await getERC20Balance(actor.address, usdcAddress));
        console.log("> user Osqth %s", await getERC20Balance(actor.address, osqthAddress));

        expect(await getERC20Balance(actor.address, usdcAddress)).not.equal("0");
        expect(await getERC20Balance(actor.address, usdcAddress)).not.equal("0");
        expect(await getERC20Balance(actor.address, osqthAddress)).not.equal("0");

        expect(await getERC20Balance(oneClickDepositAddress, wethAddress)).to.equal("0");
        expect(await getERC20Balance(oneClickDepositAddress, usdcAddress)).to.equal("0");
        expect(await getERC20Balance(oneClickDepositAddress, osqthAddress)).to.equal("0");
    });

    it("flash deposit real", async function () {
        this.skip();
        // const oneClickDepositAddress = _oneClickDepositAddress;
        const oneClickDepositAddress = OneClickDeposit.address;

        console.log("> user Eth %s", await getERC20Balance(actor.address, wethAddress));
        console.log("> user Eth a %s", await getERC20Allowance(actor.address, oneClickDepositAddress, wethAddress));

        console.log("> Contract Eth balance %s", await getERC20Balance(oneClickDepositAddress, wethAddress));
        console.log("> Contract Usdc balance %s", await getERC20Balance(oneClickDepositAddress, usdcAddress));
        console.log("> Contract Osqth balance %s", await getERC20Balance(oneClickDepositAddress, osqthAddress));

        tx = await OneClickDeposit.connect(actor).deposit(
            "4000000000000000",
            "995000000000000000",
            "0x6C4830E642159Be2e6c5cC4C6012BC5a21AA95Ce",
            "0",
            {
                gasLimit: 1500000,
                gasPrice: 10000000000,
            }
        );

        receipt = await tx.wait();
        console.log("> deposit()");
        console.log("> Gas used: %s", receipt.gasUsed);

        console.log("> user Eth %s", await getERC20Balance(actor.address, wethAddress));
        console.log("> user Usdc %s", await getERC20Balance(actor.address, usdcAddress));
        console.log("> user Osqth %s", await getERC20Balance(actor.address, osqthAddress));

        expect(await getERC20Balance(actor.address, wethAddress)).not.equal("0");
        expect(await getERC20Balance(actor.address, usdcAddress)).to.equal("0");
        expect(await getERC20Balance(actor.address, osqthAddress)).to.equal("0");

        expect(await getERC20Balance(oneClickDepositAddress, wethAddress)).to.equal("0");
        expect(await getERC20Balance(oneClickDepositAddress, usdcAddress)).to.equal("0");
        expect(await getERC20Balance(oneClickDepositAddress, osqthAddress)).to.equal("0");
    });
});
