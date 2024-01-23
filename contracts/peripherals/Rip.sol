// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Rip {
    mapping(address => uint256) public owners;
    mapping(address => bool) public isOwner;

    address public multisig;

    uint256 public timelockInBlocks = 4 * 60 * 24 * 7 * 4 * 3; // 3 months

    constructor(address _multisig, address owner1, address owner2) {
        multisig = _multisig;
        _addOwner(owner1);
        _addOwner(owner2);
    }

    //TODO: check is 2 out of 3 is enougth to remove this contract from multisig
    function executeCall(address target, bytes memory data) public payable onlyActivatedOwner returns (bytes memory) {
        (bool success, bytes memory response) = target.call{value: msg.value}(data);
        require(success, "External call failed");
        return response;
    }

    function transferAsset(address asset, address to, uint256 amount) public onlyActivatedOwner {
        IERC20(asset).transfer(to, amount);
    }

    //? owner activation

    function activateOwner() external onlyOwner {
        owners[msg.sender] = block.number;
    }

    function deactivateOwner(address _owner) external onlyOwner {
        owners[_owner] = 0;
    }

    function setTimelockInBlocks(uint256 _timelockInBlocks) external onlyMultisig {
        timelockInBlocks = _timelockInBlocks;
    }

    function setMultisig(address _multisig) external onlyMultisig {
        multisig = _multisig;
    }

    function addOwner(address owner) external onlyMultisig {
        _addOwner(owner);
    }

    function removeOwner(address owner) external onlyMultisig {
        delete owners[owner];
        delete isOwner[owner];
    }

    //? internal

    function _addOwner(address owner) internal {
        require(!isOwner[owner], "Owner already exists");
        owners[owner] = 0;
        isOwner[owner] = true;
    }

    //? modifiers

    modifier onlyActivatedOwner() {
        require(isOwner[msg.sender], "Not an owner");
        require(owners[msg.sender] > 0 && block.number - owners[msg.sender] >= timelockInBlocks, "Not activated");
        _;
    }

    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not an owner");
        _;
    }

    modifier onlyMultisig() {
        require(msg.sender == multisig, "Not multisig");
        _;
    }
}
