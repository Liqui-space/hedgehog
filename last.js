const { providers } = require("ethers");

async function main() {
    const provider = new providers.JsonRpcProvider("https://mainnet.infura.io/v3/02dc1b201ea0402eb4d789fb23b5ce6a");
    const startDate = new Date("2022-10-02T00:00:00Z");
    const endDate = new Date();

    let currentDay = new Date(startDate);
    let blockNumber = await getBlockNumberByDate(provider, currentDay);

    while (currentDay <= endDate) {
        const lastBlock = await getLastBlockOfTheDay(provider, blockNumber, currentDay);
        console.log(`Last block of ${currentDay.toISOString().substring(0, 10)}: ${lastBlock}`);

        // Move to the next day
        currentDay.setDate(currentDay.getDate() + 1);
        blockNumber = lastBlock + 1;
    }
}

async function getBlockNumberByDate(provider, date) {
    const targetTimestamp = Math.floor(date.getTime() / 1000);
    let lowerBound = 0;
    let upperBound = await provider.getBlockNumber();

    while (lowerBound <= upperBound) {
        const middleBlockNumber = Math.floor((lowerBound + upperBound) / 2);
        const middleBlock = await provider.getBlock(middleBlockNumber);
        const middleTimestamp = middleBlock.timestamp;

        console.log(
            `Searching for start block: lowerBound=${lowerBound}, upperBound=${upperBound}, middleBlockNumber=${middleBlockNumber}, middleTimestamp=${new Date(
                middleTimestamp * 1000
            ).toISOString()}`
        );

        if (middleTimestamp < targetTimestamp) {
            lowerBound = middleBlockNumber + 1;
        } else if (middleTimestamp > targetTimestamp) {
            upperBound = middleBlockNumber - 1;
        } else {
            return middleBlockNumber;
        }
    }

    return lowerBound;
}

async function getLastBlockOfTheDay(provider, blockNumber, date) {
    let stepSize = 1;
    let currentBlock = await provider.getBlock(blockNumber);
    let currentBlockDate = new Date(currentBlock.timestamp * 1000);

    while (currentBlockDate.toISOString().substring(0, 10) === date.toISOString().substring(0, 10)) {
        const nextBlock = await provider.getBlock(blockNumber + stepSize);
        const nextBlockDate = new Date(nextBlock.timestamp * 1000);

        console.log(
            `Searching for last block: blockNumber=${blockNumber}, stepSize=${stepSize}, nextBlockNumber=${
                blockNumber + stepSize
            }, nextBlockDate=${nextBlockDate.toISOString()}`
        );

        if (nextBlockDate.toISOString().substring(0, 10) === date.toISOString().substring(0, 10)) {
            blockNumber += stepSize;
            stepSize *= 2;
        } else {
            stepSize = Math.floor(stepSize / 2);
            if (stepSize < 1) stepSize = 1;
        }
    }

    return blockNumber;
}

main().catch(console.error);
