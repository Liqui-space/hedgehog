// SPDX-License-Identifier: agpl-3.0
pragma solidity =0.8.4;

interface ICheapRebalancerOld {
    function returnGovernance(address to) external;

    function setKeeper(address to) external;

    function returnOwner(address to) external;

    function setContracts(address bigRabalancer) external;

    function owner() external view returns (address);

    function transferOwnership(address newOwner) external;

    function rebalance(uint256 a, uint256 b) external;
}
