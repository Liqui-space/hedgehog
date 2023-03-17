// SPDX-License-Identifier: agpl-3.0
pragma solidity =0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IVaultStorage {
    function timeAtLastRebalance() external view returns (uint256);

    function auctionTime() external view returns (uint256);

    function maxPriceMultiplier() external view returns (uint256);

    function minPriceMultiplier() external view returns (uint256);

    function setRebalanceTimeThreshold(uint256 _rebalanceTimeThreshold) external;

    function setGovernance(address to) external;

    function setKeeper(address to) external;
}

interface IModule {
    function setKeeper(address to) external;

    function setGovernance(address to) external;
}

contract Rebalancer is Ownable {

    IVaultStorage VaultStorage = IVaultStorage(0x66aE7D409F559Df4E13dFe8b323b570Ab86e68B8);

    uint256 public newThreshold = 604800;

    constructor() Ownable() {}

    function setParams(address _addressStorage) external onlyOwner {
        VaultStorage = IVaultStorage(_addressStorage);
    }

    function setNewThreshold(uint256 _newThreshold) external onlyOwner {
        newThreshold = _newThreshold;
    }

    function thresholdManipulation(uint256 newPM) internal {
        uint256 maxPM = VaultStorage.maxPriceMultiplier();
        uint256 minPM = VaultStorage.minPriceMultiplier();

        VaultStorage.setRebalanceTimeThreshold(
            block.timestamp - VaultStorage.timeAtLastRebalance() - VaultStorage.auctionTime() * (maxPM - newPM) / (maxPM - minPM) 
        );
    }

    function complexCall(
        address module,
        bytes calldata _data,
        address _governance,
        address _keeper,
        uint256 newPM
    ) public onlyOwner {
        if (_governance != address(0)) VaultStorage.setGovernance(_governance);
        if (_keeper != address(0)) VaultStorage.setKeeper(_keeper);

        if (newPM != 0) thresholdManipulation(newPM);
        (bool success, ) = module.call(_data);
        require(success, "CF");
        if (newPM != 0) VaultStorage.setRebalanceTimeThreshold(newThreshold);

        if (_keeper != address(0)) IModule(_keeper).setKeeper(address(this));
        if (_governance != address(0)) IModule(_governance).setGovernance(address(this));
    }
}
