//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";

contract HogeVendor is OwnableUpgradeable {

    using SafeMath for uint256;
    IERC20 constant HOGE = IERC20(0xfAd45E47083e4607302aa43c65fB3106F1cd7607);
    address payable constant dev = payable(0x133A5437951EE1D312fD36a74481987Ec4Bf8A96);
    struct Price { //Prices are in HOGE per ETH. Larger number == Cheaper HOGE.
        uint128 bid;
        uint128 ask;
    }
    Price price;
    receive() external payable {}

    function initialize(uint set_bidPrice, uint set_askPrice) public initializer {
        price.bid = uint128(set_bidPrice);
        price.ask = uint128(set_askPrice);
        __Ownable_init();
    }

    function ask() public view returns (uint128) {
        return price.ask;
    }

    function vendorAsk() public view returns (uint amountHOGE, uint amountETH) {
        //Summarizes the HOGE available for purchase
        if (price.ask == 0) return (0,0);
        uint allowance = HOGE.allowance(owner(), address(this));
        uint balance = HOGE.balanceOf(owner());
        amountHOGE = (allowance > balance ? balance : allowance);
        amountETH =  amountHOGE.mul(10**9).div(price.ask).mul(100).div(99);
    }

    function buyQuote(uint amountETH) public view returns (uint amountHOGE) {
        //Converts ETH to HOGE at the ask rate
        amountHOGE = amountETH.mul(price.ask).div(10**9);
        (uint hogeForSale,) = vendorAsk();
        require (amountHOGE <= hogeForSale, "Not enough HOGE to complete order.");
    }

    function buyHOGE() public payable returns (uint amountBought) {
        // Executes a buy.
        require(price.ask > 0, "Not interested.");
        require(msg.value > 0, "Congratulations, you bought zero HOGE.");
        amountBought = buyQuote(msg.value.mul(99).div(100));
        dev.transfer(msg.value.div(100));
        HOGE.transferFrom(owner(), _msgSender(), amountBought);
    }

    function bid() public view returns (uint128) {
        return price.bid;
    }

    function vendorBid() public view returns (uint amountHOGE, uint amountETH) {
        // Summarizes the ETH available for purchase
        amountHOGE = address(this).balance.mul(price.bid).div(10**9);
        amountETH = address(this).balance.mul(99).div(100);
    }

    function sellQuote(uint amountHOGE) public view returns (uint amountETH) {
        // Converts HOGE to ETH at the bid rate
        amountETH = price.bid == 0 ? 0 : amountHOGE.mul(10**9).div(price.bid);
        require (amountETH <= address(this).balance, "Not enough ETH to complete order.");
    }

    function sellHOGE(uint amountHOGE) public returns (uint ethToPay) {
        // Executes a sell.
        require(price.bid > 0, "Not interested.");
        require(amountHOGE > 0, "Congratulations, you sold zero HOGE.");
        ethToPay = sellQuote(amountHOGE);
        HOGE.transferFrom(_msgSender(), owner(), amountHOGE);
        payable(_msgSender()).transfer(ethToPay.mul(99).div(100));
        dev.transfer(ethToPay.div(100));
    }

    function releaseFunds(uint amount) public onlyOwner() {
        // Releases ETH back to owner.
        payable(owner()).transfer(amount);
    }

    function kill() public onlyOwner() {
        // Good night, sweet vendor.
        releaseFunds(address(this).balance);
        price.bid = 0;
        price.ask = 0;
    }
}
