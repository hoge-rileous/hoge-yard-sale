//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "./HogeVendor.sol";

interface IHogeVendor {
    function initialize(string memory name) external;
}

contract VendorFactory is Context {

    event VendorCreated(address indexed creator, address indexed vendor);
    address vendorContract;

    constructor(address vendorAddress) public {
        vendorContract = vendorAddress;
    }

    function createVendor(string memory name) public returns (address new_vendor) {
        new_vendor = Clones.clone(vendorContract);
        IHogeVendor(new_vendor).initialize(name);
        Ownable(new_vendor).transferOwnership(_msgSender());
        emit VendorCreated(_msgSender(), new_vendor);
    }    


}
