// SPDX-License-Identifier: agpl-3.0
pragma solidity =0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import {PRBMathUD60x18} from "../libraries/math/PRBMathUD60x18.sol";

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

/**
 * Error
 * C0: Not an owner
 */

contract Rebalancer is Ownable {
    using PRBMathUD60x18 for uint256;

    IVaultStorage VaultStorage = IVaultStorage(0x66aE7D409F559Df4E13dFe8b323b570Ab86e68B8);

    constructor() Ownable() {}

    function setParams(address _addressStorage) external onlyOwner {
        VaultStorage = IVaultStorage(_addressStorage);
    }

    function thresholdManipulation(uint256 newPM) internal {
        uint256 maxPM = VaultStorage.maxPriceMultiplier();
        uint256 minPM = VaultStorage.minPriceMultiplier();

        VaultStorage.setRebalanceTimeThreshold(
            block.timestamp.sub(VaultStorage.timeAtLastRebalance()).sub(
                (VaultStorage.auctionTime()).mul(maxPM.sub(newPM).div(maxPM.sub(minPM)))
            )
        );
    }

    function complexCall(
        address module,
        bytes calldata _data,
        address _governance,
        address _keeper,
        uint256 newPM,
        uint256 newThreshold
    ) public onlyOwner {
        if (_governance != address(0)) VaultStorage.setGovernance(_governance);
        if (_keeper != address(0)) VaultStorage.setKeeper(_keeper);

        if (newPM != 0) thresholdManipulation(newPM); //TODO: Yuvhen chak it if feasible
        (bool success, ) = module.call(_data);
        require(success, "call failed");
        if (newThreshold != 0) VaultStorage.setRebalanceTimeThreshold(newThreshold); //TODO: Yuvhen chak it if feasible

        if (_keeper != address(0)) IModule(_keeper).setKeeper(address(this));
        if (_governance != address(0)) IModule(_governance).setGovernance(address(this));
    }
}
