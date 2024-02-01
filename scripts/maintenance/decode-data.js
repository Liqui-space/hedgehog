const { ethers } = require("ethers");

const decodeTransferAsset = (data) => {
    const functionSignature = "transferAsset(address,address,uint256)";
    const iface = new ethers.utils.Interface([`function ${functionSignature}`]);
    const decoded = iface.decodeFunctionData(functionSignature, data);

    console.log("Asset:", decoded[0]);
    console.log("To:", decoded[1]);
    console.log("Amount:", decoded[2].toString());
};

const decodeSetTimelock = (data) => {
    const functionSignature = "setTimelockInBlocks(uint256)";
    const iface = new ethers.utils.Interface([`function ${functionSignature}`]);
    const decoded = iface.decodeFunctionData(functionSignature, data);

    console.log("Blocks:", decoded[0].toString());
};

const doSmthForYevhen = (data) => {
    try {
        decodeTransferAsset(data);
    } catch (e) {}
    try {
        decodeSetTimelock(data);
    } catch (e) {}
};

// The data string you want to decode
doSmthForYevhen("0xf9a50f550000000000000000000000000000000000000000000000000000000000000004");

// Alternative:
// https://lab.miguelmota.com/ethereum-input-data-decoder/example/
