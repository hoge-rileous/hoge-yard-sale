//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "./TokenVendor.sol";

interface ITokenVendor {
    function initialize1(address tokenAddress) external;
    function initialize2(uint buyPrice, uint sellPrice) external;
}

contract VendorFactory is Context {

    event VendorCreated(address indexed creator, address indexed vendor);
    address vendorContract;
    mapping (address => address) proxiedVendor;

    constructor(address vendorAddress) {
        vendorContract = vendorAddress;
        address hogeVendor = Clones.clone(vendorContract);
        ITokenVendor(hogeVendor).initialize1(0xfAd45E47083e4607302aa43c65fB3106F1cd7607);
        proxiedVendor[0xfAd45E47083e4607302aa43c65fB3106F1cd7607] = hogeVendor;
    }

    function createVendor(uint buyPrice, uint sellPrice, address tokenAddress) public payable returns (address new_vendor) {
        //require(buyPrice >= sellPrice, "buyPrice must be larger than sellPrice")
        new_vendor = Clones.clone(proxiedVendor[tokenAddress]);
        ITokenVendor(new_vendor).initialize2(buyPrice, sellPrice);
        Ownable(new_vendor).transferOwnership(_msgSender());
        payable(new_vendor).transfer(msg.value);
        emit VendorCreated(_msgSender(), new_vendor);
    }    


}
