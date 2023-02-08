const { ethers } = require("hardhat");
const { utils } = ethers;
const { getAndApproveWETH, getERC20Balance, logBalance } = require("./index");

const depositOCComponent = async (ethAmount, depositor, Vault, oneClickDeposit, mainLabel) => {
    const amountWETH = utils.parseUnits(ethAmount, 18);
    await getAndApproveWETH(depositor, amountWETH, oneClickDeposit);
    await logBalance(depositor, `> ${mainLabel} Balances Before Deposit`);

    tx = await oneClickDeposit.connect(depositor).deposit(amountWETH, "995000000000000000", depositor.address, "0");
    await tx.wait();

    await logBalance(depositor, `> ${mainLabel} Balances After Deposit`);
    console.log(`> ${mainLabel} Share After Deposit`, await getERC20Balance(depositor, Vault.address));
};

module.exports = { depositOCComponent };
