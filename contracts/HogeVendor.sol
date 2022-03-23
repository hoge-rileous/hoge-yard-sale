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
    //Prices are in HOGE per ETH. Larger number == Cheaper HOGE.
    struct Price { 
        uint128 bid;
        uint128 ask;
    }
    Price price;

    function initialize(uint set_bidPrice, uint set_askPrice) public initializer {
        require(set_bidPrice >= set_askPrice, "bidPrice must be larger than askPrice");
        price.bid = uint128(set_bidPrice / 10**9);
        price.ask = uint128(set_askPrice / 10**9);
        HOGE = IERC20(0xfAd45E47083e4607302aa43c65fB3106F1cd7607);
        __Ownable_init();
    }

    receive() external payable {}

    function vendorAsk() public view returns (uint amountHOGE, uint amountETH) {
        uint allowance = HOGE.allowance(owner(), address(this));
        uint balance = HOGE.balanceOf(owner());
        amountHOGE = (allowance > balance ? balance : allowance);
        //ETH quote is at a 98/99 discount so that seller takes half of tax impact.
        amountETH =  amountHOGE.mul(10**9).mul(98).div(99).div(price.ask);
    }

    function buyQuote(uint amountETH) public view returns (uint amountHOGE) {
        amountHOGE = amountETH.mul(price.ask).mul(99).div(98).div(10**9);
        (uint hogeForSale,) = vendorAsk();
        require (amountHOGE <= hogeForSale, "Not enough HOGE to complete order.");
    }

    function buyHOGE() public payable returns (uint amountBought) {
        require(msg.value > 0, "Congratulations, you bought zero HOGE.");
        amountBought = buyQuote(msg.value);
        HOGE.transferFrom(owner(), _msgSender(), amountBought);
    }

    function vendorBid() public view returns (uint amountHOGE, uint amountETH) {
        amountHOGE = address(this).balance.mul(price.bid).mul(99).div(98).div(10**9);
        amountETH = address(this).balance;
    }

    function sellQuote(uint amountHOGE) public view returns (uint amountETH) {
        amountETH = amountHOGE.mul(10**9).mul(98).div(price.bid).div(99);
        require (amountETH <= address(this).balance, "Not enough ETH to complete order.");
    }

    function sellHOGE(uint amountHOGE) public returns (uint ethToPay) {
        require(amountHOGE > 0, "Congratulations, you sold zero HOGE.");
        ethToPay = sellQuote(amountHOGE);
        console.log(ethToPay);
        HOGE.transferFrom(_msgSender(), owner(), amountHOGE);
        payable(_msgSender()).transfer(ethToPay);
    }

    function releaseFunds(uint amount) public onlyOwner() {
        payable(owner()).transfer(amount);
    }
}
