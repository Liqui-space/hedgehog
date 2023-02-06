// SPDX-License-Identifier: agpl-3.0
pragma solidity =0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {PRBMathUD60x18} from "../libraries/math/PRBMathUD60x18.sol";

import {IAuction} from "../interfaces/IAuction.sol";
import {IVaultMath} from "../interfaces/IVaultMath.sol";
import {IVaultStorage} from "../interfaces/IVaultStorage.sol";
import {IVaultTreasury} from "../interfaces/IVaultTreasury.sol";
import {IEulerDToken, IEulerMarkets, IExec} from "./IEuler.sol";

import {ISwapRouter} from "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import {TransferHelper} from "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";

// Rebalance flow

// branch 1 (targetEth < ethBalance && targetUsdc < usdcBalance && targetOsqth > osqthBalance)
// 1) borrow osqth (get weth on euler and swap it to osqth)
// 2) get usdc & weth
// 3) sellv3 usdc
// 4) return weth

// branch 2 (targetEth < ethBalance && targetUsdc > usdcBalance && targetOsqth > osqthBalance)
// 1) borrow usdc & osqth (borrow weth on euler and swap it to osqth)
// 2) get weth
// 3) sellv3 weth
// 4) return usdc & weth

// branch 3 (targetEth > ethBalance && targetUsdc < usdcBalance && targetOsqth > osqthBalance)
// 1) borrow weth & osqth (borrow weth on euler and swap it to osqth)
// 2) get usdc
// 3) sellv3 usdc
// 4) return weth

contract BigRebalancerEuler is Ownable {
    using PRBMathUD60x18 for uint256;

    address public addressAuction = 0x2f1D08D53d04559933dBF436a5cD15182a190110;
    address public addressMath = 0x40B22821f694f1F3b226b57B5852d7832e2B5f3f;
    address public addressTreasury = 0x12804580C15F4050dda61D44AFC94623198848bC;
    address public addressStorage = 0xa6D7b99c05038ad2CC39F695CF6D2A06DdAD799a;

    // univ3
    ISwapRouter constant swapRouter = ISwapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564);

    // euler
    address constant exec = 0x59828FdF7ee634AaaD3f58B19fDBa3b03E2D9d80;
    address constant euler = 0x27182842E098f60e3D576794A5bFFb0777E025d3;
    IEulerMarkets constant markets = IEulerMarkets(0x3520d5a913427E6F0D6A83E07ccD4A4da316e4d3);

    // erc20 tokens
    address constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address constant OSQTH = 0xf1B99e3E573A1a9C5E6B2Ce818b617F0E664E86B;

    struct FlCallbackData {
        uint256 type_of_arbitrage;
        uint256 amount1;
        uint256 amount2;
        uint256 threshold;
    }

    constructor() Ownable() {
        TransferHelper.safeApprove(OSQTH, address(swapRouter), type(uint256).max);
        TransferHelper.safeApprove(WETH, address(swapRouter), type(uint256).max);
        TransferHelper.safeApprove(USDC, address(swapRouter), type(uint256).max);

        IERC20(USDC).approve(addressAuction, type(uint256).max);
        IERC20(OSQTH).approve(addressAuction, type(uint256).max);
        IERC20(WETH).approve(addressAuction, type(uint256).max);

        IERC20(USDC).approve(euler, type(uint256).max);
        IERC20(OSQTH).approve(euler, type(uint256).max);
        IERC20(WETH).approve(euler, type(uint256).max);
    }

    function setContracts(
        address _addressAuction,
        address _addressMath,
        address _addressTreasury,
        address _addressStorage
    ) external onlyOwner {
        addressAuction = _addressAuction;
        addressMath = _addressMath;
        addressTreasury = _addressTreasury;
        addressStorage = _addressStorage;

        IERC20(USDC).approve(addressAuction, type(uint256).max);
        IERC20(OSQTH).approve(addressAuction, type(uint256).max);
        IERC20(WETH).approve(addressAuction, type(uint256).max);
    }

    function setKeeper(address to) external onlyOwner {
        IVaultStorage(addressStorage).setKeeper(to);
    }

    function collectProtocol(
        uint256 amountEth,
        uint256 amountUsdc,
        uint256 amountOsqth,
        address to
    ) external onlyOwner {
        if (amountEth > 0) IERC20(WETH).transfer(to, amountEth);
        if (amountUsdc > 0) IERC20(USDC).transfer(to, amountUsdc);
        if (amountOsqth > 0) IERC20(OSQTH).transfer(to, amountOsqth);
    }

    //dev triggerTime - deprecated param
    function rebalance(uint256 threshold, uint256 triggerTime) public onlyOwner {
        FlCallbackData memory data;

        (, uint256 auctionTriggerTime) = IVaultMath(addressMath).isTimeRebalance();

        IVaultTreasury(addressTreasury).externalPoke();

        (
            uint256 targetEth,
            uint256 targetUsdc,
            uint256 targetOsqth,
            uint256 ethBalance,
            uint256 usdcBalance,
            uint256 osqthBalance
        ) = IAuction(addressAuction).getParams(auctionTriggerTime);

        data.threshold = threshold;

        if (targetEth > ethBalance && targetUsdc > usdcBalance && targetOsqth < osqthBalance) {
            // 1) borrow weth & usdc
            // 2) get osqth
            // 3) sellv3 osqth
            // 4) return eth & usdc

            data.type_of_arbitrage = 1;
            data.amount1 = targetEth - ethBalance + 10;
            data.amount2 = targetUsdc - usdcBalance + 10;

            IExec(exec).deferLiquidityCheck(address(this), abi.encode(data));
        } else if (targetEth < ethBalance && targetUsdc < usdcBalance && targetOsqth > osqthBalance) {
            // 1) borrow osqth
            // 2) get usdc & weth
            // 3) sellv3 usdc & weth
            // 4) return osqth

            data.type_of_arbitrage = 2;
            data.amount1 = targetOsqth - osqthBalance + 10;

            IExec(exec).deferLiquidityCheck(address(this), abi.encode(data));
        } else if (targetEth < ethBalance && targetUsdc > usdcBalance && targetOsqth > osqthBalance) {
            // 1) borrow usdc & osqth
            // 2) get weth
            // 3) sellv3 weth
            // 4) return usdc & osqth

            data.type_of_arbitrage = 3;
            data.amount1 = targetUsdc - usdcBalance + 10;
            data.amount2 = targetOsqth - osqthBalance + 10;

            IExec(exec).deferLiquidityCheck(address(this), abi.encode(data));
        } else if (targetEth > ethBalance && targetUsdc < usdcBalance && targetOsqth < osqthBalance) {
            // 1) borrow weth
            // 2) get usdc & osqth
            // 3) sellv3 usdc & osqth
            // 4) return weth

            data.type_of_arbitrage = 4;
            data.amount1 = targetEth - ethBalance + 10;

            IExec(exec).deferLiquidityCheck(address(this), abi.encode(data));
        } else if (targetEth > ethBalance && targetUsdc < usdcBalance && targetOsqth > osqthBalance) {
            // 1) borrow weth & osqth
            // 2) get usdc
            // 3) sellv3 usdc
            // 4) return osqth & weth

            data.type_of_arbitrage = 5;
            data.amount1 = targetEth - ethBalance + 10;
            data.amount2 = targetOsqth - osqthBalance + 10;

            IExec(exec).deferLiquidityCheck(address(this), abi.encode(data));
        } else if (targetEth < ethBalance && targetUsdc > usdcBalance && targetOsqth < osqthBalance) {
            // 1) borrow usdc
            // 2) get osqth & weth
            // 3) sellv3 osqth & weth
            // 4) return usdc

            data.type_of_arbitrage = 6;
            data.amount1 = targetUsdc - usdcBalance + 10;

            IExec(exec).deferLiquidityCheck(address(this), abi.encode(data));
        } else {
            revert("NO arbitage");
        }
    }

    function onDeferredLiquidityCheck(bytes memory encodedData) external {
        require(msg.sender == euler, "e/flash-loan/on-deferred-caller");
        FlCallbackData memory data = abi.decode(encodedData, (FlCallbackData));
        uint256 ethBefore = IERC20(WETH).balanceOf(address(this));

        if (data.type_of_arbitrage == 1) {
            IEulerDToken borrowedDToken1 = IEulerDToken(markets.underlyingToDToken(WETH));
            borrowedDToken1.borrow(0, data.amount1);
            IEulerDToken borrowedDToken2 = IEulerDToken(markets.underlyingToDToken(USDC));
            borrowedDToken2.borrow(0, data.amount2);

            IAuction(addressAuction).timeRebalance(address(this), 0, 0, 0);

            // swap all oSQTH to wETH
            swapRouter.exactInputSingle(
                ISwapRouter.ExactInputSingleParams({
                    tokenIn: address(OSQTH),
                    tokenOut: address(WETH),
                    fee: 3000,
                    recipient: address(this),
                    deadline: block.timestamp,
                    amountIn: IERC20(OSQTH).balanceOf(address(this)),
                    amountOutMinimum: 0,
                    sqrtPriceLimitX96: 0
                })
            );

            // buy USDC with part of wETH
            swapRouter.exactOutputSingle(
                ISwapRouter.ExactOutputSingleParams({
                    tokenIn: address(WETH),
                    tokenOut: address(USDC),
                    fee: 500,
                    recipient: address(this),
                    deadline: block.timestamp,
                    amountOut: data.amount2,
                    amountInMaximum: type(uint256).max,
                    sqrtPriceLimitX96: 0
                })
            );

            borrowedDToken1.repay(0, data.amount1);
            borrowedDToken2.repay(0, data.amount2);
        } else if (data.type_of_arbitrage == 2) {
            IEulerDToken borrowedDToken1 = IEulerDToken(markets.underlyingToDToken(OSQTH));
            borrowedDToken1.borrow(0, data.amount1);

            IAuction(addressAuction).timeRebalance(address(this), 0, 0, 0);

            // WETH -> USDC
            swapRouter.exactInputSingle(
                ISwapRouter.ExactInputSingleParams({
                    tokenIn: address(USDC),
                    tokenOut: address(WETH),
                    fee: 500,
                    recipient: address(this),
                    deadline: block.timestamp,
                    amountIn: IERC20(USDC).balanceOf(address(this)),
                    amountOutMinimum: 0,
                    sqrtPriceLimitX96: 0
                })
            );
            // WETH -> OSQTH
            swapRouter.exactOutputSingle(
                ISwapRouter.ExactOutputSingleParams({
                    tokenIn: address(WETH),
                    tokenOut: address(OSQTH),
                    fee: 3000,
                    recipient: address(this),
                    deadline: block.timestamp,
                    amountOut: data.amount1,
                    amountInMaximum: IERC20(WETH).balanceOf(address(this)),
                    sqrtPriceLimitX96: 0
                })
            );
            borrowedDToken1.repay(0, data.amount1);
        } else if (data.type_of_arbitrage == 3) {
            IEulerDToken borrowedDToken1 = IEulerDToken(markets.underlyingToDToken(USDC));
            borrowedDToken1.borrow(0, data.amount1);
            IEulerDToken borrowedDToken2 = IEulerDToken(markets.underlyingToDToken(OSQTH));
            borrowedDToken2.borrow(0, data.amount2);

            IAuction(addressAuction).timeRebalance(address(this), 0, 0, 0);

            // WETH -> oSQTH
            swapRouter.exactOutputSingle(
                ISwapRouter.ExactOutputSingleParams({
                    tokenIn: address(WETH),
                    tokenOut: address(OSQTH),
                    fee: 3000,
                    recipient: address(this),
                    deadline: block.timestamp,
                    amountOut: data.amount2,
                    amountInMaximum: IERC20(WETH).balanceOf(address(this)),
                    sqrtPriceLimitX96: 0
                })
            );

            // USDC -> WETH
            swapRouter.exactOutputSingle(
                ISwapRouter.ExactOutputSingleParams({
                    tokenIn: address(WETH),
                    tokenOut: address(USDC),
                    fee: 500,
                    recipient: address(this),
                    deadline: block.timestamp,
                    amountOut: data.amount1,
                    amountInMaximum: IERC20(WETH).balanceOf(address(this)),
                    sqrtPriceLimitX96: 0
                })
            );

            borrowedDToken1.repay(0, data.amount1);
            borrowedDToken2.repay(0, data.amount2);
        } else if (data.type_of_arbitrage == 4) {
            IEulerDToken borrowedDToken1 = IEulerDToken(markets.underlyingToDToken(WETH));
            borrowedDToken1.borrow(0, data.amount1);

            IAuction(addressAuction).timeRebalance(address(this), 0, 0, 0);

            // swap all oSQTH to wETH
            swapRouter.exactInputSingle(
                ISwapRouter.ExactInputSingleParams({
                    tokenIn: address(OSQTH),
                    tokenOut: address(WETH),
                    fee: 3000,
                    recipient: address(this),
                    deadline: block.timestamp,
                    amountIn: IERC20(OSQTH).balanceOf(address(this)),
                    amountOutMinimum: 0,
                    sqrtPriceLimitX96: 0
                })
            );

            // swap all USDC to wETH
            swapRouter.exactInputSingle(
                ISwapRouter.ExactInputSingleParams({
                    tokenIn: address(USDC),
                    tokenOut: address(WETH),
                    fee: 500,
                    recipient: address(this),
                    deadline: block.timestamp,
                    amountIn: IERC20(USDC).balanceOf(address(this)),
                    amountOutMinimum: 0,
                    sqrtPriceLimitX96: 0
                })
            );

            borrowedDToken1.repay(0, data.amount1);
        } else if (data.type_of_arbitrage == 5) {
            IEulerDToken borrowedDToken1 = IEulerDToken(markets.underlyingToDToken(WETH));
            borrowedDToken1.borrow(0, data.amount1);
            IEulerDToken borrowedDToken2 = IEulerDToken(markets.underlyingToDToken(OSQTH));
            borrowedDToken2.borrow(0, data.amount2);

            IAuction(addressAuction).timeRebalance(address(this), 0, 0, 0);

            // WETH -> USDC
            swapRouter.exactInputSingle(
                ISwapRouter.ExactInputSingleParams({
                    tokenIn: address(USDC),
                    tokenOut: address(WETH),
                    fee: 500,
                    recipient: address(this),
                    deadline: block.timestamp,
                    amountIn: IERC20(USDC).balanceOf(address(this)),
                    amountOutMinimum: 0,
                    sqrtPriceLimitX96: 0
                })
            );

            // WETH -> oSQTH
            swapRouter.exactOutputSingle(
                ISwapRouter.ExactOutputSingleParams({
                    tokenIn: address(WETH),
                    tokenOut: address(OSQTH),
                    fee: 3000,
                    recipient: address(this),
                    deadline: block.timestamp,
                    amountOut: data.amount2,
                    amountInMaximum: IERC20(WETH).balanceOf(address(this)),
                    sqrtPriceLimitX96: 0
                })
            );

            borrowedDToken1.repay(0, data.amount1);
            borrowedDToken2.repay(0, data.amount2);
        } else if (data.type_of_arbitrage == 6) {
            IEulerDToken borrowedDToken1 = IEulerDToken(markets.underlyingToDToken(USDC));
            borrowedDToken1.borrow(0, data.amount1);

            IAuction(addressAuction).timeRebalance(address(this), 0, 0, 0);
            // sell all oSQTH to wETH
            swapRouter.exactInputSingle(
                ISwapRouter.ExactInputSingleParams({
                    tokenIn: address(OSQTH),
                    tokenOut: address(WETH),
                    fee: 3000,
                    recipient: address(this),
                    deadline: block.timestamp,
                    amountIn: IERC20(OSQTH).balanceOf(address(this)),
                    amountOutMinimum: 0,
                    sqrtPriceLimitX96: 0
                })
            );
            // swap all wETH to USDC
            swapRouter.exactOutputSingle(
                ISwapRouter.ExactOutputSingleParams({
                    tokenIn: address(WETH),
                    tokenOut: address(USDC),
                    fee: 500,
                    recipient: address(this),
                    deadline: block.timestamp,
                    amountOut: data.amount1,
                    amountInMaximum: type(uint256).max,
                    sqrtPriceLimitX96: 0
                })
            );

            borrowedDToken1.repay(0, data.amount1);
        }

        require(IERC20(WETH).balanceOf(address(this)).sub(ethBefore) > data.threshold, "NEP");
    }
}
