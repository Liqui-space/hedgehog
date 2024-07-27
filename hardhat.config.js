require("module-alias/register");
require("@nomiclabs/hardhat-waffle");
require("hardhat-contract-sizer");
require("hardhat-gas-reporter");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-ethers");

const { ETHERSCAN_KEY, INFURA_MAINNET_URL, HEDGEHOG_OWNER } = require("@shared/config");

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
    const accounts = await hre.ethers.getSigners();

    for (const account of accounts) {
        console.log(account.address);
    }
});

module.exports = {
    networks: {
        mainnet: {
            url: INFURA_MAINNET_URL,
            accounts: [HEDGEHOG_OWNER],
            gasPrice: 55 * 10 ** 9,
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
        // apiKey: ETHERSCAN_KEY_ARBITRUM,
    },
    gasReporter: {
        enabled: process.env.REPORT_GAS ? true : false,
    },
};
