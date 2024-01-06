// SPDX-License-Identifier: MIT
pragma solidity =0.8.4;

import "hardhat/console.sol";

contract Rip {
    struct Delegate {
        bool exists;
        uint256 activationBlock;
    }

    mapping(address => Delegate) public delegates;

    address public multisig;

    uint256 public timelockInBlocks = 4 * 60 * 24 * 7 * 4 * 3; // 3 months

    constructor(address _multisig, address delegate1, address delegate2) {
        multisig = _multisig;
        _addDelegate(delegate1);
        _addDelegate(delegate2);
    }

    // check is 2 out of 3 is enougth to remove this contract from multisig
    function executeCall(
        address target,
        bytes memory data
    ) public payable isDelegate isActivatedDelegate returns (bytes memory) {
        (bool success, bytes memory response) = target.call{value: msg.value}(data);
        require(success, "External call failed");
        return response;
    }

    //? delegate activation

    function activateDelegate() external isDelegate {
        delegates[msg.sender].activationBlock = block.number;
    }

    function deactivateDelegate(address _delegate) external isDelegate {
        delegates[_delegate].activationBlock = 0;
    }

    function setTimelockInBlocks(uint256 _timelockInBlocks) external isAdmin {
        timelockInBlocks = _timelockInBlocks;
    }

    function addDelegate(address delegate) external isAdmin {
        _addDelegate(delegate);
    }

    function removeDelegate(address delegate) external isAdmin {
        delete delegates[delegate];
    }

    //? internal

    function _addDelegate(address delegate) internal {
        require(!delegates[delegate].exists, "Delegate already exists");
        delegates[delegate] = Delegate(true, 0);
    }

    //? modifiers

    modifier isActivatedDelegate() {
        require(
            delegates[msg.sender].activationBlock > 0 &&
                block.number - delegates[msg.sender].activationBlock >= timelockInBlocks,
            "Not activated"
        );
        _;
    }

    modifier isDelegate() {
        require(delegates[msg.sender].exists, "Not a delegate");
        _;
    }

    modifier isAdmin() {
        require(msg.sender == multisig, "Not multisig");
        _;
    }
}
