const { BigNumber } = require("ethers");
const { ethers, network } = require("hardhat");
const { wethAddress, usdcAddress, osqthAddress, _biggestOSqthHolder } = require("@shared/constants");

async function getToken(amount, account, tokenAddress, accountHolder) {
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

const getETH = async (account, eth) => {
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

const toHexdigital = (amount) => {
    return "0x" + amount.toString(16);
};

const getERC20Balance = async (account, tokenAddress) => {
    if(typeof account == 'object') account = account.address;
    const ERC20 = await ethers.getContractAt("IWETH", tokenAddress);
    return (await ERC20.balanceOf(account)).toString();
};

const approveERC20 = async (owner, account, amount, tokenAddress) => {
    if(typeof account == 'object') account = account.address;
    const ERC20 = await ethers.getContractAt("IWETH", tokenAddress);
    await ERC20.connect(owner).approve(account, amount);
};

const getERC20Allowance = async (ownerAddress, spenderAddress, tokenAddress) => {
    const ERC20 = await ethers.getContractAt("IWETH", tokenAddress);
    return (await ERC20.allowance(ownerAddress, spenderAddress)).toString();
};

const getAndApprove = async (actor, contractAddress, wethInput, usdcInput, osqthInput) => {
    await getWETH(wethInput, actor.address);
    await getUSDC(usdcInput, actor.address);
    await getOSQTH(osqthInput, actor.address);

    await approveERC20(actor, contractAddress, wethInput, wethAddress);
    await approveERC20(actor, contractAddress, usdcInput, usdcAddress);
    await approveERC20(actor, contractAddress, osqthInput, osqthAddress);
};

const getAndApprove2 = async (actor, contractAddress, wethInput, usdcInput, osqthInput) => {
    await getWETH(wethInput, actor.address, "0x06920c9fc643de77b99cb7670a944ad31eaaa260");
    await getUSDC(usdcInput, actor.address, "0xf885bdd59e5652fe4940ca6b8c6ebb88e85a5a40");
    await getOSQTH(osqthInput, actor.address, _biggestOSqthHolder);

    await approveERC20(actor, contractAddress, wethInput, wethAddress);
    await approveERC20(actor, contractAddress, usdcInput, usdcAddress);
    await approveERC20(actor, contractAddress, osqthInput, osqthAddress);
};

const getSnapshot = async (address) => {
    return {
        WETH: await getERC20Balance(address, wethAddress),
        USDC: await getERC20Balance(address, usdcAddress),
        oSQTH: await getERC20Balance(address, osqthAddress),
        ETH: await ethers.provider.getBalance(address),
    };
};


module.exports = {
    getETH,
    getSnapshot,
    getAndApprove,
    getAndApprove2,
    getOSQTH,
    approveERC20,
    getUSDC,
    getWETH,
    toHexdigital,
    getERC20Allowance,
    getERC20Balance,
};
