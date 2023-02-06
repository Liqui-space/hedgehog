const { ALCHEMY_KEY } = require('@shared/config');

const getForkingParams = (blockNumber = 14487787) => {
    return {
        url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_KEY}`,
        blockNumber,
    };
}

const getResetParams = (blockNumber = 14487787) => {
    return {
        jsonRpcUrl: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_KEY}`,
        blockNumber,
    };
}

module.exports = {
    getForkingParams,
    getResetParams
}