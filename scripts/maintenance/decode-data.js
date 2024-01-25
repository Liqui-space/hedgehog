const { ethers } = require("ethers");

// The data string you want to decode
const data =
    "0x439e2e45000000000000000000000000fd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9000000000000000000000000cfa2aa4f0aaf2b86e495bceaef5519c8dcec397c00000000000000000000000000000000000000000000000000000000000f4240";

const functionSignature = "transferAsset(address,address,uint256)";
const iface = new ethers.utils.Interface([`function ${functionSignature}`]);
const decoded = iface.decodeFunctionData(functionSignature, data);

console.log("Asset:", decoded[0]);
console.log("To:", decoded[1]);
console.log("Amount:", decoded[2].toString());
