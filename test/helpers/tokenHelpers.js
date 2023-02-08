const { ethers } = require("hardhat");
const { wethAddress, usdcAddress, osqthAddress } = require("@shared/constants");
const erc20Helpers = require("./ERC20");
const { getToken, approveERC20 } = erc20Helpers;

const getETH = async (account, eth) => {
    if (typeof account == "object") account = account.address;
    const [owner] = await ethers.getSigners();
    await owner.sendTransaction({
        to: account,
        value: eth,
    });
};

async function getWETH(amount, account, ath) {
    await getToken(amount, account, wethAddress, ath || "0x2f0b23f53734252bda2277357e97e1517d6b042a");
}

async function getUSDC(amount, account, ath) {
    await getToken(amount, account, usdcAddress, ath || "0x2e6907a0ce523ccb5532ffea2e411df1eee26607");
}

async function getOSQTH(amount, account, ath) {
    await getToken(amount, account, osqthAddress, ath || "0x56178a0d5F301bAf6CF3e1Cd53d9863437345Bf9");
}

const athsV1 = ["0x06920c9fc643de77b99cb7670a944ad31eaaa260", "0xf885bdd59e5652fe4940ca6b8c6ebb88e85a5a40", undefined];

const getAndApprove = async (
    actor,
    contractAddress,
    wethInput,
    usdcInput,
    osqthInput,
    ath = [undefined, undefined, undefined]
) => {
    await getWETH(wethInput, actor.address, ath[0]);
    await getUSDC(usdcInput, actor.address, ath[1]);
    await getOSQTH(osqthInput, actor.address, ath[2]);

    await approveERC20(actor, contractAddress, wethInput, wethAddress);
    await approveERC20(actor, contractAddress, usdcInput, usdcAddress);
    await approveERC20(actor, contractAddress, osqthInput, osqthAddress);
};

const getAndApproveWETH = async (owner, amount, toAddress) => {
    await getWETH(amount, owner.address, "0xF02e86D9E0eFd57aD034FaF52201B79917fE0713");
    await approveERC20(owner, toAddress, amount, wethAddress);
};

module.exports = {
    ...erc20Helpers,
    getAndApproveWETH,
    getETH,
    getWETH,
    getUSDC,
    getOSQTH,
    athsV1,
    getAndApprove,
};
