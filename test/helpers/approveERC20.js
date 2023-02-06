const { ethers } = require("hardhat");

const { getWETH, getUSDC, getOSQTH } = require("./getERC20");

const approveERC20 = async (owner, account, amount, tokenAddress) => {
    if (typeof account == "object") account = account.address;
    const ERC20 = await ethers.getContractAt("IWETH", tokenAddress);
    await ERC20.connect(owner).approve(account, amount);
};

const getERC20Allowance = async (ownerAccount, spenderAccount, tokenAddress) => {
    if (typeof ownerAccount == "object") ownerAccount = ownerAccount.address;
    if (typeof spenderAccount == "object") spenderAccount = spenderAccount.address;
    const ERC20 = await ethers.getContractAt("IWETH", tokenAddress);
    return (await ERC20.allowance(ownerAccount, spenderAccount)).toString();
};

const getAndApprove = async (ownerAccount, spenderAccount, wethInput, usdcInput, osqthInput, type = 0) => {
    let alternativeTokenHolderWETH = type == 1 ? "0x06920c9fc643de77b99cb7670a944ad31eaaa260" : undefined;
    let alternativeTokenHolderUSDC = type == 1 ? "0xf885bdd59e5652fe4940ca6b8c6ebb88e85a5a40" : undefined;
    await getWETH(wethInput, ownerAccount, alternativeTokenHolderWETH);
    await getUSDC(usdcInput, ownerAccount, alternativeTokenHolderUSDC);
    await getOSQTH(osqthInput, ownerAccount);

    await approveERC20(ownerAccount, spenderAccount, wethInput, wethAddress);
    await approveERC20(ownerAccount, spenderAccount, usdcInput, usdcAddress);
    await approveERC20(ownerAccount, spenderAccount, osqthInput, osqthAddress);
};

module.exports = {
    getAndApprove,
    approveERC20,
    getERC20Allowance,
};
