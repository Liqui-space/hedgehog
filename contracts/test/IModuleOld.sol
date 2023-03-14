// SPDX-License-Identifier: agpl-3.0
pragma solidity =0.8.4;

interface IModuleOld {
    function owner() external view returns (address);

    function addressAuction() external view returns (address);

    function addressMath() external view returns (address);

    function addressTreasury() external view returns (address);

    function addressStorage() external view returns (address);

    function transferOwnership(address newOwner) external;

    function setContracts(
        address _addressAuction,
        address _addressMath,
        address _addressTreasury,
        address _addressStorage
    ) external;

    function setKeeper(address to) external;
}
