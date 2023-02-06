process.exit(0); // Block file in order to not accidentally deploy

const { _vaultAddress, _oneClickDepositAddress, _oneClickWithdrawAddress } = require("../test/common");
const { deployContract } = require("@shared/deploy");

const deploy = async () => {
    const Contract = await deployContract("BigRebalancerEuler", [], false);
    console.log(Contract.address);
};

deploy().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
