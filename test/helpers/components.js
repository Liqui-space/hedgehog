const { assert } = require("chai");

const { ethers } = require("hardhat");
const { utils } = ethers;
const {
    getAndApproveWETH,
    getERC20Balance,
    logBalance,
    getWETH,
    getOSQTH,
    getUSDC,
    impersontate,
    getETH,
} = require("./index");

const depositOCComponent = async (
    ethAmount,
    actor,
    Vault,
    oneClickDeposit,
    mainLabel,
    multiplier = "995000000000000000"
) => {
    const amountWETH = utils.parseUnits(ethAmount, 18);
    await getAndApproveWETH(actor, amountWETH, oneClickDeposit);
    await logBalance(actor, `> ${mainLabel} Balances Before Deposit`);
    console.log(`> ${mainLabel} Share Before Deposit`, await getERC20Balance(actor, Vault.address));

    tx = await oneClickDeposit.connect(actor).deposit(amountWETH, multiplier, actor.address, "0");
    await tx.wait();
    console.log(`> oneClickDeposit()`);

    await logBalance(actor, `> ${mainLabel} Balances After Deposit`);
    console.log(`> ${mainLabel} Share After Deposit`, await getERC20Balance(actor, Vault.address));
};

const withdrawComponent = async (allShares, actor, Vault, mainLabel) => {
    await logBalance(actor, `> ${mainLabel} Balance Before Witdraw`);
    console.log(`> ${mainLabel} Share Before Witdraw`, await getERC20Balance(actor.address, Vault.address));

    tx = await Vault.connect(actor).withdraw(allShares, "0", "0", "0");
    await tx.wait();
    console.log(`> Vault.withdraw()`);

    await logBalance(actor, `> ${mainLabel} Balance After Witdraw`);
    console.log(`> ${mainLabel} Share After Witdraw`, await getERC20Balance(actor.address, Vault.address));
};

const swapTypes = ["USDC_WETH", "OSQTH_WETH", "WETH_USDC", "WETH_OSQTH"];
const swapComponent = async (swapType, swapAmountString, V3Helper, log = false) => {
    if (!swapTypes.includes(swapType)) throw new Error("Swap type is not defined");

    if (log) await logBalance(V3Helper.address, `> V3Helper before ${swapType}`);

    let swapAmount;
    if (swapType == swapTypes[0]) {
        swapAmount = utils.parseUnits(swapAmountString, 6).toString();
        await getUSDC(swapAmount, V3Helper.address);
    }
    if (swapType == swapTypes[1]) {
        swapAmount = utils.parseUnits(swapAmountString, 18).toString();
        await getOSQTH(swapAmount, V3Helper.address);
    }
    if (swapType == swapTypes[2]) {
        swapAmount = utils.parseUnits(swapAmountString, 18).toString();
        await getWETH(swapAmount, V3Helper.address);
    }
    if (swapType == swapTypes[3]) {
        swapAmount = utils.parseUnits(swapAmountString, 18).toString();
        await getWETH(swapAmount, V3Helper.address);
    }

    const tx = await V3Helper["swap" + swapType](swapAmount);
    await tx.wait();

    if (log) await logBalance(V3Helper.address, `> V3Helper after ${swapType}`);
};

const getContract = async (name, address) => {
    const contract = await ethers.getContractFactory(name);
    return await contract.attach(address);
};

const getActivatedOwner = async (ContractFacory) => {
    const owner = await impersontate(await ContractFacory.owner());
    await getETH(owner, utils.parseEther("20"));
    return owner;
};

const getInterface = async (name, address) => {
    return await ethers.getContractAt(name, address);
};

const rebalanceClassicComponent = async (rebalancer, Rebalancer, RebalanceModule) => {
    await logBalance(RebalanceModule.address, "> RebalanceModule before rebalance");

    await executeTx(
        Rebalancer.connect(rebalancer).rebalanceClassic(RebalanceModule.address, 0),
        "classicRebalance",
        true
    );

    await logBalance(RebalanceModule.address, "> RebalanceModule after rebalance");
};

const shouldThrowErrorComponent = async (promise, errMessage, errText) => {
    if (errMessage.length < 20)
        errMessage = `VM Exception while processing transaction: reverted with reason string '${errMessage}'`;
    let succeded = false;
    try {
        await promise;
    } catch (err) {
        if (err.message == errMessage) succeded = true;
        else console.log("Error messege\n", err.message);
    }
    assert(succeded, errText);
};

const shouldThrowErrorComponentVM = async (promise, errMessage, errText) => {
    errMessage = `VM Exception while processing transaction: reverted with reason string '${errMessage}'`;
    let succeded = false;
    try {
        await promise;
    } catch (err) {
        if (err.message == errMessage) succeded = true;
        else console.log("Error messege\n", err.message);
    }
    assert(succeded, errText);
};

const executeTx = async (promise, label = "", logGas = false) => {
    tx = await promise;
    receipt = await tx.wait();
    if ((label != "") & !logGas) console.log(`> ${label}() executed`);
    if ((label != "") & logGas) console.log(`> ${label}() executed with Gas: ${receipt.gasUsed.toString()}`);
    return receipt;
};

module.exports = {
    getActivatedOwner,
    getInterface,
    getContract,
    executeTx,
    rebalanceClassicComponent,
    depositOCComponent,
    withdrawComponent,
    shouldThrowErrorComponent,
    shouldThrowErrorComponentVM,
    swapComponent,
};
