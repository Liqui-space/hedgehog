// SPDX-License-Identifier: agpl-3.0
pragma solidity =0.8.4;

interface IModuleOld {
    function owner() external view returns (address);

    function transferOwnership(address newOwner) external;

    function setContracts(
        address _addressAuction,
        address _addressMath,
        address _addressTreasury,
        address _addressStorage
    ) external;
}
