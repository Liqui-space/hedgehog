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

    function setGovernance(address _governance) external;

    function setKeeper(address _governance) external;

    function keeper() external view returns (address);
}

interface IModule {
    function rebalance(uint256 threshold, uint256 triggerTime) external;

    function collectProtocol(
        uint256 amountEth,
        uint256 amountUsdc,
        uint256 amountOsqth,
        address to
    ) external;

    function transferOwnership(address newOwner) external;

    function setKeeper(address to) external;
}

/**
 * Error
 * M0: Not an owner
 */

contract Rebalancer is Ownable {
    using PRBMathUD60x18 for uint256;

    address addressStorage = 0xa6D7b99c05038ad2CC39F695CF6D2A06DdAD799a;

    mapping(address => bool) public isOwner;

    constructor() Ownable() {}

    function setParams(address _addressStorage) external onlyOwner {
        addressStorage = _addressStorage;
    }

    function returnOwner(address to, address module) external onlyOwner {
        IModule(module).transferOwnership(to);
    }

    function setGovernance(address to) external onlyOwner {
        IVaultStorage(addressStorage).setGovernance(to);
    }

    function setKeeper(address to) external onlyOwner {
        IVaultStorage(addressStorage).setKeeper(to);
    }

    function collectProtocol(
        address module,
        uint256 amountEth,
        address to
    ) external onlyOwner {
        IModule(module).collectProtocol(amountEth, 0, 0, to);
    }

    function rebalance(
        address module,
        uint256 threshold,
        uint256 newPM,
        uint256 newThreshold
    ) public onlyOwner {
        IVaultStorage VaultStorage = IVaultStorage(addressStorage);

        VaultStorage.setKeeper(module);

        uint256 maxPM = VaultStorage.maxPriceMultiplier();
        uint256 minPM = VaultStorage.minPriceMultiplier();

        VaultStorage.setRebalanceTimeThreshold(
            block.timestamp.sub(VaultStorage.timeAtLastRebalance()).sub(
                (VaultStorage.auctionTime()).mul(maxPM.sub(newPM).div(maxPM.sub(minPM)))
            )
        );

        IModule(module).rebalance(threshold, 0);

        VaultStorage.setRebalanceTimeThreshold(newThreshold);

        IModule(module).setKeeper(address(this));
    }

    //TDOO: remove this in prod
    function rebalanceClassic(address module, uint256 threshold) public onlyOwner {
        IVaultStorage(addressStorage).setKeeper(module);
        IModule(module).rebalance(threshold, 0);
        IModule(module).setKeeper(address(this));
    }
}
