//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";

contract HogeVendor is OwnableUpgradeable {
    using SafeMath for uint256;
    string name;

    function initialize(string memory new_name) public initializer {
        name = new_name;
        __Ownable_init();
    }

    function getName() public view returns (string memory) {
        return name;
    }


}
