const { BigNumber } = require("ethers");
const { ethers, network } = require("hardhat");
const { wethAddress, usdcAddress, osqthAddress } = require("@shared/constants");

async function getToken(amount, account, tokenAddress, accountHolder) {
    if(typeof account == 'object') account = account.address;
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

async function getETH (account, eth) {
    if(typeof account == 'object') account = account.address;
    const [owner] = await ethers.getSigners();
    await owner.sendTransaction({
        to: account,
        value: eth,
    });
};

async function getWETH(amount, account, alternativeTokenHolder) {
    if(typeof account == 'object') account = account.address;
    const wethAccountHolder = alternativeTokenHolder || "0x2f0b23f53734252bda2277357e97e1517d6b042a";
    await getToken(amount, account, wethAddress, wethAccountHolder);
}

async function getUSDC(amount, account, alternativeTokenHolder) {
    if(typeof account == 'object') account = account.address;
    const usdcAccountHolder = alternativeTokenHolder || "0x2e6907a0ce523ccb5532ffea2e411df1eee26607";
    await getToken(amount, account, usdcAddress, usdcAccountHolder);
}

async function getOSQTH(amount, account, alternativeTokenHolder) {
    if(typeof account == 'object') account = account.address;
    const osqthAccountHolder = alternativeTokenHolder || "0x94b86a218264c7c424c1476160d675a05ecb0b3d";
    await getToken(amount, account, osqthAddress, osqthAccountHolder);
}

const getERC20Balance = async (account, tokenAddress) => {
    if(typeof account == 'object') account = account.address;
    const ERC20 = await ethers.getContractAt("IWETH", tokenAddress);
    return (await ERC20.balanceOf(account)).toString();
};

module.exports = {
    getETH,
    getOSQTH,
    getUSDC,
    getWETH,
    getERC20Balance,
};
