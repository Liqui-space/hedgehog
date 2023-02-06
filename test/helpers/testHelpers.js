const { ethers } = require("hardhat");
const { utils } = ethers;
const csv = require("csvtojson");
const path = require("path");
const { getResetParams } = require("hardhat.helpers");
const { wethAddress, osqthAddress, usdcAddress } = require("@shared/constants");
const { getERC20Balance } = require("./tokenHelpers");

const loadTestDataset = async (name) => {
    const csvFilePath = path.join(__dirname, "../ds/", `${name}.csv`);
    const array = await csv().fromFile(csvFilePath);
    return array;
};

const assertWP = (a, b, pres = 4, num = 18) => {
    if (pres < 0 || num < 0) throw Error("Params are not good");
    a = a.toString();
    b = b.toString();
    const getTail = (value, pres, num) => {
        let decimals;
        if (value.length > num) decimals = value.slice(-num);
        else decimals = "0".repeat(num - value.length) + value;

        const tail = decimals.slice(0, pres);
        return tail;
    };

    const getFront = (value, num) => {
        let front = "";
        if (value.length > num) front = value.slice(0, -num);
        return front;
    };

    if (getTail(a, pres, num) == getTail(b, pres, num) && getFront(a, num) == getFront(b, num)) return true;

    console.log("current  >>>", utils.formatUnits(a, num));
    console.log("current  >>>", a);
    console.log("expected >>>", utils.formatUnits(b, num));
    console.log("expected >>>", b);

    return false;
};

//? Assert wp tests
// console.log(assertWP("33111111", "33111111", 6, 6)); // true
// console.log(assertWP("33111111", "33111112", 6, 6)); // false
// console.log(assertWP("33111111", "33111112", 5, 6)); // true
// console.log(assertWP("0", "113828607665", 5, 18)); // true
// console.log(assertWP("33011111", "33111112", 0, 6)); // true
// console.log(assertWP("33011111", "34111112", 0, 6)); // false

const resetFork = async (blockNumber = 14487787) => {
    await network.provider.request({
        method: "hardhat_reset",
        params: [
            {
                forking: getResetParams(blockNumber),
            },
        ],
    });
};

const logBlock = async () => {
    const blockNumBefore = await ethers.provider.getBlockNumber();
    const blockBefore = await ethers.provider.getBlock(blockNumBefore);
    const timestampBefore = blockBefore.timestamp;
    console.log("> blockNumber:", blockNumBefore, "timestamp:", timestampBefore);
};

const logBalance = async (address, label = "") => {
    console.log(label + " WETH", await getERC20Balance(address, wethAddress));
    console.log(label + " USDC", await getERC20Balance(address, usdcAddress));
    console.log(label + " oSQTH", await getERC20Balance(address, osqthAddress));
};

module.exports = {
    logBalance,
    logBlock,
    resetFork,
    assertWP,
    loadTestDataset,
};
