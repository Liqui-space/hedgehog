const { ethers } = require("hardhat");
const { utils } = ethers;
const { BigNumber } = require("ethers");

module.exports = [
    utils.parseUnits("228", 18),
    BigNumber.from(604800),
    utils.parseUnits("0.1", 18),
    BigNumber.from("1200"),
    BigNumber.from("950000000000000000"),
    BigNumber.from("1050000000000000000"),
    BigNumber.from("0"),
    "0x17e8a3e01A73c754052cdCdee29E5804300c5406",
    "0xfE08EEb4d98551Ea6eB474b24356a82Cf60277e2",
];
