// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;

import "hardhat/console.sol";

contract Rip {
    struct Owner {
        bool exists;
        uint256 activationBlock;
    }

    mapping(address => Owner) public owners;
    mapping(address => bool) public isOwner;

    address public multisig;

    uint256 public timelockInBlocks = 4 * 60 * 24 * 7 * 4 * 3; // 3 months

    constructor(address _multisig, address owner1, address owner2) {
        multisig = _multisig;
        _addOwner(owner1);
        _addOwner(owner2);
    }

    // check is 2 out of 3 is enougth to remove this contract from multisig
    function executeCall(
        address target,
        bytes memory data
    ) public payable isOwner isActivatedOwner returns (bytes memory) {
        (bool success, bytes memory response) = target.call{value: msg.value}(data);
        require(success, "External call failed");
        return response;
    }

    //? owner activation

    function activateOwner() external isOwner {
        owners[msg.sender].activationBlock = block.number;
    }

    function deactivateOwner(address _owner) external isOwner {
        owners[_owner].activationBlock = 0;
    }

    function setTimelockInBlocks(uint256 _timelockInBlocks) external isAdmin {
        timelockInBlocks = _timelockInBlocks;
    }

    function addOwner(address owner) external isAdmin {
        _addOwner(owner);
    }

    function removeOwner(address owner) external isAdmin {
        delete owners[owner];
    }

    //? internal

    function _addOwner(address owner) internal {
        require(!owners[owner].exists, "Owner already exists");
        owners[owner] = Owner(true, 0);
    }

    //? modifiers

    modifier isActivatedOwner() {
        require(
            owners[msg.sender].activationBlock > 0 &&
                block.number - owners[msg.sender].activationBlock >= timelockInBlocks,
            "Not activated"
        );
        _;
    }

    modifier isOwner() {
        require(owners[msg.sender].exists, "Not a owner");
        _;
    }

    modifier isAdmin() {
        require(msg.sender == multisig, "Not multisig");
        _;
    }
}
