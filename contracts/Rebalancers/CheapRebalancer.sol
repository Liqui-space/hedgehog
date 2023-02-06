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
}

interface IRebalancer {
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

contract CheapRebalancer is Ownable {
    using PRBMathUD60x18 for uint256;

    address addressStorage = 0xa6D7b99c05038ad2CC39F695CF6D2A06DdAD799a;

    mapping(address => bool) public isOwner;

    constructor() Ownable() {}

    function setContracts(address _addressStorage) external onlyOwner {
        addressStorage = _addressStorage;
    }

    function returnOwner(address to, address rebalancer) external onlyOwner {
        IRebalancer(rebalancer).transferOwnership(to);
    }

    function setGovernance(address to) external onlyOwner {
        IVaultStorage(addressStorage).setGovernance(to);
    }

    function setKeeper(address to) external onlyOwner {
        IVaultStorage(addressStorage).setKeeper(to);
    }

    //TODO: think about should we pass 3 params exept 1
    function collectProtocol(
        address rebalancer,
        uint256 amountEth,
        address to
    ) external onlyOwner {
        IRebalancer(rebalancer).collectProtocol(amountEth, 0, 0, to);
    }

    function rebalance(
        address rebalancer,
        uint256 threshold,
        uint256 newPM,
        uint256 newThreshold
    ) public onlyOwner {
        IVaultStorage VaultStorage = IVaultStorage(addressStorage);

        VaultStorage.setKeeper(rebalancer);

        uint256 maxPM = VaultStorage.maxPriceMultiplier();
        uint256 minPM = VaultStorage.minPriceMultiplier();

        VaultStorage.setRebalanceTimeThreshold(
            block.timestamp.sub(VaultStorage.timeAtLastRebalance()).sub(
                (VaultStorage.auctionTime()).mul(maxPM.sub(newPM).div(maxPM.sub(minPM)))
            )
        );

        IRebalancer(rebalancer).rebalance(threshold, 0);

        VaultStorage.setRebalanceTimeThreshold(newThreshold);

        IRebalancer(rebalancer).setKeeper(address(this));
    }
}
