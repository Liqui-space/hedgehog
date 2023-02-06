// SPDX-License-Identifier: Unlicense

pragma solidity =0.8.4;

interface IEulerDToken {
    function borrow(uint256 subAccountId, uint256 amount) external;

    function balanceOf(address account) external view returns (uint256);

    function repay(uint256 subAccountId, uint256 amount) external;
}

interface IExec {
    function deferLiquidityCheck(address account, bytes memory data) external;
}

interface IEulerMarkets {
    function activateMarket(address underlying) external returns (address);

    function underlyingToEToken(address underlying) external view returns (address);

    function underlyingToDToken(address underlying) external view returns (address);

    function enterMarket(uint256 subAccountId, address newMarket) external;

    function exitMarket(uint256 subAccountId, address oldMarket) external;
}
