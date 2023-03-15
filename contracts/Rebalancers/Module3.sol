// SPDX-License-Identifier: agpl-3.0
pragma solidity =0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {FlashLoanReceiverBase} from "../libraries/aave/FlashLoanReceiverBase.sol";
import {ILendingPool} from "../libraries/aave/interfaces/ILendingPool.sol";
import {ILendingPoolAddressesProvider} from "../libraries/aave/interfaces/ILendingPoolAddressesProvider.sol";

import {ISwapRouter} from "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import {TransferHelper} from "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";

import "hardhat/console.sol";

// Rebalance flow

// branch 1 (targetEth > ethBalance && targetUsdc > usdcBalance && targetOsqth < osqthBalance)
// 1) borrow weth & usdc
// 2) get osqth
// 3) sellv3 osqth
// 4) return eth & usdc

// branch 2 (targetEth < ethBalance && targetUsdc < usdcBalance && targetOsqth > osqthBalance)
// 1) borrow osqth (get weth on euler and swap it to osqth)
// 2) get usdc & weth
// 3) sellv3 usdc
// 4) return weth

// branch 3 (targetEth < ethBalance && targetUsdc > usdcBalance && targetOsqth > osqthBalance)
// 1) borrow usdc & osqth (borrow weth on euler and swap it to osqth)
// 2) get weth
// 3) sellv3 weth
// 4) return usdc & weth

// branch 4 (targetEth > ethBalance && targetUsdc < usdcBalance && targetOsqth < osqthBalance)
// 1) borrow weth
// 2) get usdc & osqth
// 3) sellv3 usdc & osqth
// 4) return weth

// branch 5 (targetEth > ethBalance && targetUsdc < usdcBalance && targetOsqth > osqthBalance)
// 1) borrow weth & osqth (borrow weth on euler and swap it to osqth)
// 2) get usdc
// 3) sellv3 usdc
// 4) return weth

// branch 6 (targetEth < ethBalance && targetUsdc > usdcBalance && targetOsqth < osqthBalance)
// 1) borrow usdc
// 2) get osqth & weth
// 3) sellv3 osqth & weth
// 4) return usdc

interface IVaultTreasury {
    function externalPoke() external;
}

interface IVaultStorage {
    function setKeeper(address _keeper) external;
}

interface IAuction {
    function timeRebalance(
        address keeper,
        uint256 minAmountEth,
        uint256 minAmountUsdc,
        uint256 minAmountOsqth
    ) external;

    function getParams(uint256 _auctionTriggerTime)
        external
        view
        returns (
            uint256,
            uint256,
            uint256,
            uint256,
            uint256,
            uint256
        );
}

interface IVaultMath {
    function isTimeRebalance() external view returns (bool, uint256);
}

contract Module3 is Ownable, FlashLoanReceiverBase {
    address public addressAuction = 0x30EF1938673c5513a817D202CDD33471894a7ED8;
    address public addressMath = 0x47c05BCCA7d57c87083EB4e586007530eE4539e9; //TODO: chage to current addresses
    address public addressTreasury = 0x12804580C15F4050dda61D44AFC94623198848bC;
    address public addressStorage = 0x66aE7D409F559Df4E13dFe8b323b570Ab86e68B8;

    // univ3
    ISwapRouter constant swapRouter = ISwapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564);

    //aavev2
    address constant landingPool = 0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9;

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

    constructor()
        Ownable()
        FlashLoanReceiverBase(ILendingPoolAddressesProvider(0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5))
    {
        TransferHelper.safeApprove(OSQTH, address(swapRouter), type(uint256).max);
        TransferHelper.safeApprove(WETH, address(swapRouter), type(uint256).max);
        TransferHelper.safeApprove(USDC, address(swapRouter), type(uint256).max);
        IERC20(USDC).approve(addressAuction, type(uint256).max);
        IERC20(OSQTH).approve(addressAuction, type(uint256).max);
        IERC20(WETH).approve(addressAuction, type(uint256).max);

        IERC20(USDC).approve(landingPool, type(uint256).max);
        IERC20(OSQTH).approve(landingPool, type(uint256).max);
        IERC20(WETH).approve(landingPool, type(uint256).max);
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

    function rebalance(uint256 threshold, uint256 triggerTime) public onlyOwner {
        FlCallbackData memory data = calculateRebalance(); //TODO think aboud memory and other
        data.threshold = threshold;

        if(data.amount2 == 0){
            address[] memory assets = new address[](1);
            uint256[] memory modes = new uint256[](1); // 0 = no debt, 1 = stable, 2 = variable
            uint256[] memory amounts = new uint256[](1);
            amounts[0] = data.amount1;
            modes[0] = 0;

            if(data.type_of_arbitrage == 6) assets[0] = USDC; //6
            else assets[0] = WETH; // 5,4,2

            LENDING_POOL.flashLoan(address(this), assets, amounts, modes, address(this), abi.encode(data), 0);
        } else {
            address[] memory assets = new address[](2);
            uint256[] memory modes = new uint256[](2);
            uint256[] memory amounts = new uint256[](2);
            amounts[0] = data.amount1;
            amounts[1] = data.amount2;
            modes[0] = 0;
            modes[1] = 0;

            if(data.type_of_arbitrage == 1){
                assets[0] = WETH;
                assets[1] = USDC;
            }
            else { //3
                assets[0] = USDC;
                assets[1] = WETH;
            }

            LENDING_POOL.flashLoan(address(this), assets, amounts, modes, address(this), abi.encode(data), 0);
        }
    }

    function calculateRebalance() internal returns (FlCallbackData memory data) {
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

        if (targetEth > ethBalance && targetUsdc > usdcBalance && targetOsqth < osqthBalance) {
            // 1) borrow weth & usdc
            // 2) get osqth
            // 3) sellv3 osqth
            // 4) return eth & usdc

            data.type_of_arbitrage = 1;
            data.amount1 = targetEth - ethBalance + 10;
            data.amount2 = targetUsdc - usdcBalance + 10;
        } else if (targetEth < ethBalance && targetUsdc < usdcBalance && targetOsqth > osqthBalance) {
            // 1) borrow osqth (get weth on euler and swap it to osqth)
            // 2) get usdc & weth
            // 3) sellv3 usdc
            // 4) return weth

            data.type_of_arbitrage = 2;
            data.amount1 = targetOsqth - osqthBalance + 10;
        } else if (targetEth < ethBalance && targetUsdc > usdcBalance && targetOsqth > osqthBalance) {
            // 1) borrow usdc & osqth (borrow weth on euler and swap it to osqth)
            // 2) get weth
            // 3) sellv3 weth
            // 4) return usdc & weth

            data.type_of_arbitrage = 3;
            data.amount1 = (targetUsdc - usdcBalance + 10) * (101);
            data.amount2 = targetOsqth - osqthBalance + 10;
        } else if (targetEth > ethBalance && targetUsdc < usdcBalance && targetOsqth < osqthBalance) {
            // 1) borrow weth
            // 2) get usdc & osqth
            // 3) sellv3 usdc & osqth
            // 4) return weth

            data.type_of_arbitrage = 4;
            data.amount1 = targetEth - ethBalance + 10;
        } else if (targetEth > ethBalance && targetUsdc < usdcBalance && targetOsqth > osqthBalance) {
            // 1) borrow weth & osqth (borrow weth on euler and swap it to osqth)
            // 2) get usdc
            // 3) sellv3 usdc
            // 4) return weth

            data.type_of_arbitrage = 5;
            data.amount1 = targetEth - ethBalance + 10;
            data.amount2 = targetOsqth - osqthBalance + 10;
        } else if (targetEth < ethBalance && targetUsdc > usdcBalance && targetOsqth < osqthBalance) {
            // 1) borrow usdc
            // 2) get osqth & weth
            // 3) sellv3 osqth & weth
            // 4) return usdc

            data.type_of_arbitrage = 6;
            data.amount1 = targetUsdc - usdcBalance + 10;
        } else {
            revert("NO arbitage");
        }
        return data;
    }

    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata encodedData
    ) external override returns (bool) {
        console.log(msg.sender);

        // require(msg.sender == euler, "R1"); //TODO: make this check on address

        FlCallbackData memory data = abi.decode(encodedData, (FlCallbackData));

        uint256 ethBefore = IERC20(WETH).balanceOf(address(this));
        if (data.type_of_arbitrage == 1) {
            
            IAuction(addressAuction).timeRebalance(address(this), 0, 0, 0);

            // swap all oSQTH to wETH
            swapExactInputSingle(OSQTH, 3000);

            // buy USDC with part of wETH
            swapExactOutputSingle(USDC, 500, data.amount2);
        } else if (data.type_of_arbitrage == 2) {
            // buy oSQTH with part of wETH
            swapExactOutputSingle(OSQTH, 3000, data.amount1);

            IAuction(addressAuction).timeRebalance(address(this), 0, 0, 0);

            // swap all USDC to wETH
            swapExactInputSingle(USDC, 500);

            // swap all oSQTH to wETH
            swapExactInputSingle(OSQTH, 3000);
        } else if (data.type_of_arbitrage == 3) {
            // buy oSQTH with wETH
            swapExactOutputSingle(OSQTH, 3000, data.amount2);

            IAuction(addressAuction).timeRebalance(address(this), 0, 0, 0);

            // swap all oSQTH to wETH
            swapExactInputSingle(OSQTH, 3000);

            // buy USDC with wETH
            swapExactOutputSingle(USDC, 500, data.amount1 - IERC20(USDC).balanceOf(address(this)));
        } else if (data.type_of_arbitrage == 4) {
            IAuction(addressAuction).timeRebalance(address(this), 0, 0, 0);

            // swap all oSQTH to wETH
            swapExactInputSingle(OSQTH, 3000);

            // swap all USDC to wETH
            swapExactInputSingle(USDC, 500);
        } else if (data.type_of_arbitrage == 5) {
            // swap part wETH to oSQTH
            swapExactOutputSingle(OSQTH, 3000, data.amount2);

            IAuction(addressAuction).timeRebalance(address(this), 0, 0, 0);

            // swap all USDC to wETH
            swapExactInputSingle(USDC, 500);
            // swap all oSQTH to wETH
            swapExactInputSingle(OSQTH, 3000);
        } else if (data.type_of_arbitrage == 6) {
            IAuction(addressAuction).timeRebalance(address(this), 0, 0, 0);

            // sell all oSQTH to wETH
            swapExactInputSingle(OSQTH, 3000);
            
            // swap all wETH to USDC
            swapExactOutputSingle(USDC, 500, data.amount1);
        }
        require(IERC20(WETH).balanceOf(address(this)) - ethBefore > data.threshold, "NEP");
        return true;
    }

    function swapExactInputSingle(address token1, uint256 pool) internal {
            swapRouter.exactInputSingle(
                ISwapRouter.ExactInputSingleParams({
                    tokenIn: token1,
                    tokenOut: WETH,
                    fee: pool,
                    recipient: address(this),
                    deadline: block.timestamp,
                    amountIn: IERC20(token1).balanceOf(address(this)),
                    amountOutMinimum: 0,
                    sqrtPriceLimitX96: 0
                })
            );
    }

    function swapExactOutputSingle(address token2, uint256 pool, uint256 amountOut) internal {
            swapRouter.exactOutputSingle(
                ISwapRouter.ExactOutputSingleParams({
                    tokenIn: WETH,
                    tokenOut: token2,
                    fee: pool,
                    recipient: address(this),
                    deadline: block.timestamp,
                    amountOut: amountOut,
                    amountInMaximum: type(uint256).max,
                    sqrtPriceLimitX96: 0
                })
            );
    }

    receive() external payable {}
}
