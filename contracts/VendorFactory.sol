//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "./TokenVendor.sol";

interface ITokenVendor {
    function initialize(uint buyPrice, uint sellPrice, address tokenAddress, uint8 tax) external;
}

contract VendorFactory is Context, Ownable{

    event VendorCreated(address indexed token, address vendor);
    address vendorContract;
    mapping (address => uint8) tax;
    mapping (address => bool) supported;

    constructor(address vendorAddress) {
        vendorContract = vendorAddress;
    }

    function addSupport(address token, uint8 set_tax) public onlyOwner() {
        tax[token] = set_tax;
        supported[token] = true;
    }

    function createVendor(uint buyPrice, uint sellPrice, address tokenAddress) public payable returns (address new_vendor) {
        //require(buyPrice >= sellPrice, "buyPrice must be larger than sellPrice")
        require(supported[tokenAddress], "Token is not supported.");
        new_vendor = Clones.clone(vendorContract);
        ITokenVendor(new_vendor).initialize(buyPrice, sellPrice, tokenAddress, tax[tokenAddress]);
        Ownable(new_vendor).transferOwnership(_msgSender());
        payable(new_vendor).transfer(msg.value);
        emit VendorCreated(tokenAddress, new_vendor);
    }    


}
