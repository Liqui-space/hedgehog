require("module-alias/register");
require("@nomiclabs/hardhat-waffle");
require("hardhat-contract-sizer");
require("hardhat-gas-reporter");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-ethers");

const { ETHERSCAN_KEY, IFURA_MAINNET_URL, HEDGEHOG_REBALANCER } = require("@shared/config");
const { getForkingParams } = require("hardhat.helpers");

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
    const accounts = await hre.ethers.getSigners();

    for (const account of accounts) {
        console.log(account.address);
    }
});

const test = {
    allowUnlimitedContractSize: process.env.DEBUG ? true : false,
    chainId: 1,
    forking: getForkingParams(),
    gasPrice: 35 * 10 ** 9,
};

const simulate = {
    allowUnlimitedContractSize: true,
    chainId: 1,
    forking: getForkingParams(15534544),
    gasPrice: 18 * 10 ** 9,
};

module.exports = {
    networks: {
        hardhat: process.env.SIMULATION ? simulate : test,
        mainnet: {
            url: IFURA_MAINNET_URL,
            accounts: [HEDGEHOG_REBALANCER],
            gasPrice: 16 * 10 ** 9,
        },
    },
    solidity: {
        compilers: [
            {
                version: "0.7.6",
                optimizer: { enabled: true, runs: 10000 },
            },
            {
                version: "0.8.4",
                optimizer: { enabled: true, runs: 10000 },
            },
            {
                version: "0.8.0",
                optimizer: { enabled: true, runs: 10000 },
            },
        ],
    },
    etherscan: {
        apiKey: ETHERSCAN_KEY,
    },
    gasReporter: {
        enabled: process.env.REPORT_GAS ? true : false,
    },
};
