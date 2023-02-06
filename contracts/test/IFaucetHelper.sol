// SPDX-License-Identifier: Unlicense

pragma solidity =0.8.4;
pragma abicoder v2;

interface IFaucetHelper {
    function uniswapMath() external view returns (address);

    function vault() external view returns (address);

    function auction() external view returns (address);

    function vaultMath() external view returns (address);

    function vaultTreasury() external view returns (address);

    function vaultStorage() external view returns (address);

    function setComponents(
        address,
        address,
        address,
        address,
        address,
        address
    ) external;
}
