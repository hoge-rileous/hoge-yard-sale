//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";

contract HogeVendor is OwnableUpgradeable {
    using SafeMath for uint256;
    IERC20 HOGE;
    uint buyPrice;
    uint sellPrice;

    function initialize(uint set_buyPrice, uint set_sellPrice) public initializer {
        buyPrice = set_buyPrice;
        sellPrice = set_sellPrice;
        HOGE = IERC20(0xfAd45E47083e4607302aa43c65fB3106F1cd7607);
        __Ownable_init();
    }

    function VendorHOGEForSale() public view returns (uint amount) {
        uint allowance = HOGE.allowance(owner(), address(this));
        uint balance = HOGE.balanceOf(owner());
        amount = allowance > balance ? balance : allowance;
    }

    function VendorHOGEToPurchase() public view returns (uint amount) {
        amount = address(this).balance.mul(buyPrice);
    }

    function buyHOGEFromVendor() public payable returns (uint amountToBuy) {
        amountToBuy = msg.value * sellPrice;
        require (amountToBuy <= VendorHOGEForSale(), "Not enough HOGE to complete order.");
        HOGE.transferFrom(owner(), _msgSender(), amountToBuy.mul(99) / 100);
        return amountToBuy;
    }

    function sellHOGEToVendor(uint amountHOGE) public returns (uint ethToPay) {
        require(amountHOGE <= VendorHOGEToPurchase());
        ethToPay = amountHOGE.div(buyPrice);
        HOGE.transferFrom(_msgSender(), owner(), amountHOGE);
        payable(_msgSender()).transfer(ethToPay);
    }

    function releaseFunds(uint amount) public onlyOwner() {
        payable(owner()).transfer(amount);
    }


}
