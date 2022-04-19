//SPDX-License-Identifier: MIT

pragma solidity 0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Whitelist is Ownable {
    mapping (address => bool) private whitelist;
   
    function isWhitelisted(address account) public view returns (bool) {
       return whitelist[account];
    }

    function addWhitelist(address[] memory account) external onlyOwner() {
        for (uint256 i = 0; i < account.length; i++) {
        	whitelist[account[i]] = true;
        }
    }
    
    function removeWhitelist(address[] memory account) external onlyOwner() {
        for (uint256 i = 0; i < account.length; i++) {
        	whitelist[account[i]] = false;
        }
    }
}