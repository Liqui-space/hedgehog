const { BigNumber } = require("ethers");
const { ethers, network } = require("hardhat");

const toHexdigital = (amount) => {
    return "0x" + amount.toString(16);
};

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

async function getToken(amount, account, tokenAddress, accountHolder) {
    if (typeof account == "object") account = account.address;
    if (!BigNumber.from(amount).gt(BigNumber.from(0))) return;
    await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [accountHolder],
    });

    const signer = await ethers.getSigner(accountHolder);
    const ERC20 = await ethers.getContractAt("IWETH", tokenAddress);

    await network.provider.send("hardhat_setBalance", [signer.address, toHexdigital(100812679875357878208)]);

    await ERC20.connect(signer).transfer(account, amount);

    await network.provider.request({
        method: "hardhat_stopImpersonatingAccount",
        params: [accountHolder],
    });
}

const getERC20Balance = async (account, tokenAddress) => {
    if (typeof account == "object") account = account.address;
    const ERC20 = await ethers.getContractAt("IWETH", tokenAddress);
    return (await ERC20.balanceOf(account)).toString();
};

module.exports = {
    toHexdigital,
    getERC20Balance,
    getToken,
    getERC20Allowance,
    approveERC20,
};
