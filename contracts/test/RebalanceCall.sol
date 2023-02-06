// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.0;

pragma abicoder v2;

import {IAuction} from "../interfaces/IAuction.sol";
import {IVaultMath} from "../interfaces/IVaultMath.sol";
import {IVaultTreasury} from "../interfaces/IVaultTreasury.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "hardhat/console.sol";

contract RebalanceCall {
    address public addressAuction = 0xe38b6847E611e942E6c80eD89aE867F522402e80;
    address public addressMath = 0x2c8ED11fd7A058096F2e5828799c68BE88744E2F;
    address public addressTreasury = 0x7580708993de7CA120E957A62f26A5dDD4b3D8aC;

    address constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address constant OSQTH = 0xf1B99e3E573A1a9C5E6B2Ce818b617F0E664E86B;

    constructor() {
        IERC20(USDC).approve(addressAuction, type(uint256).max);
        IERC20(OSQTH).approve(addressAuction, type(uint256).max);
        IERC20(WETH).approve(addressAuction, type(uint256).max);
    }

    function call() public {
        (, uint256 auctionTriggerTime) = IVaultMath(addressMath).isTimeRebalance();

        console.log("auctionTriggerTime %s", auctionTriggerTime);

        IVaultTreasury(addressTreasury).externalPoke();

        (
            uint256 targetEth,
            uint256 targetUsdc,
            uint256 targetOsqth,
            uint256 ethBalance,
            uint256 usdcBalance,
            uint256 osqthBalance
        ) = IAuction(addressAuction).getParams(auctionTriggerTime);

        console.log("targetEth    %s", targetEth);
        console.log("targetUsdc   %s", targetUsdc);
        console.log("targetOsqth  %s", targetOsqth);
        console.log("ethBalance   %s", ethBalance);
        console.log("usdcBalance  %s", usdcBalance);
        console.log("osqthBalance %s", osqthBalance);

        console.log("before call", targetOsqth - osqthBalance);

        IAuction(addressAuction).timeRebalance(address(this), 0, 0, 0);
    }

    function call2() public {
        (, uint256 auctionTriggerTime) = IVaultMath(addressMath).isTimeRebalance();

        console.log("auctionTriggerTime %s", auctionTriggerTime);

        IVaultTreasury(addressTreasury).externalPoke();

        (
            uint256 targetEth,
            uint256 targetUsdc,
            uint256 targetOsqth,
            uint256 ethBalance,
            uint256 usdcBalance,
            uint256 osqthBalance
        ) = IAuction(addressAuction).getParams(auctionTriggerTime);

        console.log("targetEth    %s", targetEth);
        console.log("targetUsdc   %s", targetUsdc);
        console.log("targetOsqth  %s", targetOsqth);
        console.log("ethBalance   %s", ethBalance);
        console.log("usdcBalance  %s", usdcBalance);
        console.log("osqthBalance %s", osqthBalance);

        // console.log("before call", targetEth - ethBalance);
        console.log("before call", targetUsdc - usdcBalance);

        IAuction(addressAuction).timeRebalance(address(this), 0, 0, 0);
    }

    function collectProtocol(
        uint256 amountEth,
        uint256 amountUsdc,
        uint256 amountOsqth,
        address to
    ) external {
        if (amountEth > 0) IERC20(WETH).transfer(to, amountEth);
        if (amountUsdc > 0) IERC20(USDC).transfer(to, amountUsdc);
        if (amountOsqth > 0) IERC20(OSQTH).transfer(to, amountOsqth);
    }
}
