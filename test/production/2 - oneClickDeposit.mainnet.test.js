const { ethers } = require("hardhat");
const { _oneClickDepositAddress } = require("@shared/constants");
const { resetFork, logBalance, getAndApproveWETH } = require("../helpers");
const { executeTx } = require("../helpers/components");

describe.skip("One Click deposit Mainnet", function () {
    let OneClickDeposit;
    let actor;

    it("Should set actors", async function () {
        await resetFork(16769696);

        actor = (await ethers.getSigners())[8];

        MyContract = await ethers.getContractFactory("OneClickDeposit");
        OneClickDeposit = await MyContract.attach(_oneClickDepositAddress);
    });

    it("flash deposit real (mode = 0)", async function () {
        const slippage = "995000000000000000";
        const amountETH = ethers.utils.parseEther("2");
        await getAndApproveWETH(actor, ethers.utils.parseEther("20.0"), OneClickDeposit.address);

        await logBalance(actor, "> before");
        await executeTx(OneClickDeposit.connect(actor).deposit(amountETH, slippage, actor.address, "0"));
        await logBalance(actor, "> after-");
    });
});
