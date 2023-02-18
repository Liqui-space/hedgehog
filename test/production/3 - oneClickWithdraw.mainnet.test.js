const { ethers } = require("hardhat");
const { _oneClickWithdrawAddress } = require("@shared/constants");
const { resetFork, logBalance } = require("../helpers");

describe.skip("One Click deposit Withdraw", function () {
    let tx, receipt, OneClickDeposit;
    let actor;
    let actorAddress = "0x42B1299fCcA091A83C08C24915Be6E6d63906b1a";

    it("Should set actors", async function () {
        await resetFork(15659425);

        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [actorAddress],
        });

        actor = await ethers.getSigner(actorAddress);
        console.log("actor:", actor.address);

        MyContract = await ethers.getContractFactory("OneClickWithdraw");
        OneClickWithdraw = await MyContract.attach(_oneClickWithdrawAddress);
    });

    it("flash deposit real (mode = 0)", async function () {
        tx = await OneClickWithdraw.connect(actor).withdraw(actor.address, "1000000000000000", "0", "0", "0", {
            gasLimit: 800000,
        });

        receipt = await tx.wait();
        console.log("> deposit()");
        console.log("> Gas used: %s", receipt.gasUsed);

        await logBalance(actor.address, "> user");
    });
});
