const { ethers } = require("hardhat");

const { deployContract } = require("@shared/deploy");
const { resetFork, impersontate, getETH } = require("../helpers");

describe("Rip deployment mainnet", function () {
    let Rip;
    it("Initial", async function () {
        await resetFork(18949098);
        [deployer, multisig, admin1, admin2, admin3, chad] = await ethers.getSigners();

        Rip = await deployContract("Rip", [multisig, ivan, yevhen], true);
        inface = new ethers.utils.Interface(["function transfer(address to, uint256 value)"]);
        // transferdata = inface.encodeFunctionData("transfer", [nullAddress, utils.parseEther("0.01")]);
    });

    it("Add owner", async function () {
        inface = new ethers.utils.Interface(["function addOwnerWithThreshold(address owner, uint256 threshold)"]);
        data = inface.encodeFunctionData("addOwnerWithThreshold", [Rip.address, 2]);
        await createGnosisTransaction(data, Ivan);
        // await executeTx(
        //     Multisig.connect(Ivan).execTransaction(
        //         multisig, //to
        //         0, //value
        //         data, //datas
        //         0, //operation
        //         0, //safeTxGas
        //         0, //baseGas
        //         0, //gasPrice
        //         nullAddress, //gasToken
        //         nullAddress //refundReceiver
        //         "", //TODO
        //     ),
        //     "changed admins and treshold"
        // );
    });

    const createGnosisTransaction = async (data, caller) => {
        const to = multisig;
        const value = 0;
        const operation = 0;
        const safeTxGas = 0;
        const baseGas = 0;
        const gasPrice = 0;
        const gasToken = ethers.constants.AddressZero; // ETH
        const refundReceiver = ethers.constants.AddressZero; // tx.origin
        const nonce = await Multisig.nonce();
        console.log("nonce", nonce);

        // Create the transaction hash (EIP-712 compliant)
        const txHash = await Multisig.getTransactionHash(
            to,
            value,
            data,
            operation,
            safeTxGas,
            baseGas,
            gasPrice,
            gasToken,
            refundReceiver,
            nonce
        );
        console.log("txHash", txHash);

        await getETH(yevhen, "1000000000000000000");
        // [signer] = await ethers.getSigners();
        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [yevhen],
        });
        const signer = await ethers.getSigner(yevhen);
        console.log("signer", signer);

        const signature = await signer.signMessage(ethers.utils.arrayify(txHash));
        // console.log("Signature:", signature);

        // const signature = await caller.signMessage(ethers.utils.arrayify(txHash));

        // // Extract r, s, v from the signature
        // const sig = ethers.utils.splitSignature(signature);

        // // Format the signature for Gnosis Safe
        // const formattedSignature = ethers.utils.solidityPack(["bytes32", "bytes32", "uint8"], [sig.r, sig.s, sig.v]);

        // return Multisig.connect(caller).execTransaction(
        //     multisig, //to
        //     0, //value
        //     data, //datas
        //     0, //operation
        //     0, //safeTxGas
        //     0, //baseGas
        //     0, //gasPrice
        //     nullAddress, //gasToken
        //     nullAddress //refundReceiver
        //     "", //TODO
        // )

        // Execute the transaction
        // const tx = await gnosisSafe.execTransaction(to, value, data, operation, safeTxGas, baseGas, gasPrice, gasToken, refundReceiver, formattedSignature);
        // await tx.wait();
    };
});
