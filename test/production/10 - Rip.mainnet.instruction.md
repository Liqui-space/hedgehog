multisig: 0xb94618b82A1aF398e28e66d53Af63f1263fcEA81
Ivan: 0x31Ac457944bD3754bfbe7a103a182ddc9CeBc5F5
Yevhen: 0xCFA2Aa4F0Aaf2B86E495bcEaEF5519C8dCeC397C
Token Tether USD ARB: 0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9

TreasuryV1: 0x59613339e5e2a25559851D348622521eF05B8730
https://arbiscan.io/address/0x59613339e5e2a25559851d348622521ef05b8730#readContract

TreasuryV2: 0x5A72407078ED6A84E04d6bD1f43e575a9653d723
https://arbiscan.io/address/0x5A72407078ED6A84E04d6bD1f43e575a9653d723#readContract

npx hardhat verify 0x5A72407078ED6A84E04d6bD1f43e575a9653d723 --network arbitrumMainnet --constructor-args scripts/maintenance/\_arguments.js

ABI:
[
{
"inputs": [
{
"internalType": "address",
"name": "_multisig",
"type": "address"
},
{
"internalType": "address",
"name": "owner1",
"type": "address"
},
{
"internalType": "address",
"name": "owner2",
"type": "address"
}
],
"stateMutability": "nonpayable",
"type": "constructor"
},
{
"inputs": [],
"name": "activateOwner",
"outputs": [],
"stateMutability": "nonpayable",
"type": "function"
},
{
"inputs": [
{
"internalType": "address",
"name": "owner",
"type": "address"
}
],
"name": "addOwner",
"outputs": [],
"stateMutability": "nonpayable",
"type": "function"
},
{
"inputs": [
{
"internalType": "address",
"name": "_owner",
"type": "address"
}
],
"name": "deactivateOwner",
"outputs": [],
"stateMutability": "nonpayable",
"type": "function"
},
{
"inputs": [
{
"internalType": "address",
"name": "target",
"type": "address"
},
{
"internalType": "bytes",
"name": "data",
"type": "bytes"
}
],
"name": "executeCall",
"outputs": [
{
"internalType": "bytes",
"name": "",
"type": "bytes"
}
],
"stateMutability": "payable",
"type": "function"
},
{
"inputs": [
{
"internalType": "address",
"name": "",
"type": "address"
}
],
"name": "isOwner",
"outputs": [
{
"internalType": "bool",
"name": "",
"type": "bool"
}
],
"stateMutability": "view",
"type": "function"
},
{
"inputs": [],
"name": "multisig",
"outputs": [
{
"internalType": "address",
"name": "",
"type": "address"
}
],
"stateMutability": "view",
"type": "function"
},
{
"inputs": [
{
"internalType": "address",
"name": "",
"type": "address"
}
],
"name": "owners",
"outputs": [
{
"internalType": "uint256",
"name": "",
"type": "uint256"
}
],
"stateMutability": "view",
"type": "function"
},
{
"inputs": [
{
"internalType": "address",
"name": "owner",
"type": "address"
}
],
"name": "removeOwner",
"outputs": [],
"stateMutability": "nonpayable",
"type": "function"
},
{
"inputs": [
{
"internalType": "address",
"name": "_multisig",
"type": "address"
}
],
"name": "setMultisig",
"outputs": [],
"stateMutability": "nonpayable",
"type": "function"
},
{
"inputs": [
{
"internalType": "uint256",
"name": "_timelockInBlocks",
"type": "uint256"
}
],
"name": "setTimelockInBlocks",
"outputs": [],
"stateMutability": "nonpayable",
"type": "function"
},
{
"inputs": [],
"name": "timelockInBlocks",
"outputs": [
{
"internalType": "uint256",
"name": "",
"type": "uint256"
}
],
"stateMutability": "view",
"type": "function"
},
{
"inputs": [
{
"internalType": "address",
"name": "asset",
"type": "address"
},
{
"internalType": "address",
"name": "to",
"type": "address"
},
{
"internalType": "uint256",
"name": "amount",
"type": "uint256"
}
],
"name": "transferAsset",
"outputs": [],
"stateMutability": "nonpayable",
"type": "function"
}
]
