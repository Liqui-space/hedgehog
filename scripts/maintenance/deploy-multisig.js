process.exit(0); // Block file in order to not accidentally deploy

const { deployContract } = require("@shared/deploy");

const multisig = "0xb94618b82A1aF398e28e66d53Af63f1263fcEA81";

const Ivan = "0x31Ac457944bD3754bfbe7a103a182ddc9CeBc5F5";
const Yevhen = "0xCFA2Aa4F0Aaf2B86E495bcEaEF5519C8dCeC397C";

const deploy = async () => {
    const Contract = await deployContract("Rip", [multisig, Ivan, Yevhen], true);
    console.log("Rip:", Contract.address);
};

deploy().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
