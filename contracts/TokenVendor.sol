//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";

contract TokenVendor is OwnableUpgradeable {

    using SafeMath for uint256;
    IERC20 token; // = IERC20(0xfAd45E47083e4607302aa43c65fB3106F1cd7607);
    address payable constant dev = payable(0x133A5437951EE1D312fD36a74481987Ec4Bf8A96);
    struct Price { 
        uint128 bid;
        uint128 ask;
    }
    uint8 tax;
    Price price;
    receive() external payable {}

    function initialize(uint set_bidPrice, uint set_askPrice, address set_token, uint8 set_tax) public initializer {
        price.bid = uint128(set_bidPrice);
        price.ask = uint128(set_askPrice);
        token = IERC20(set_token);
        tax = set_tax;
        __Ownable_init();
    }

    function ask() public view returns (uint128) {
        return price.ask;
    }

    function vendorAsk() public view returns (uint amounttoken, uint amountETH) {
        //Summarizes the token available for purchase
        if (price.ask == 0) return (0,0);
        uint allowance = token.allowance(owner(), address(this));
        uint balance = token.balanceOf(owner());
        amounttoken = (allowance > balance ? balance : allowance);
        amountETH =  amounttoken.mul(10**9).div(price.ask).mul(100).div(99);
    }

    function buyQuote(uint amountETH) public view returns (uint amounttoken) {
        //Converts ETH to token at the ask rate
        amounttoken = amountETH.mul(price.ask).div(10**9);
        (uint tokenForSale,) = vendorAsk();
        require (amounttoken <= tokenForSale, "Amount exceeds Ask size.");
    }

    function buyToken() public payable returns (uint amountBought) {
        // Executes a buy.
        require(price.ask > 0, "Not interested.");
        require(msg.value > 0, "Congratulations, you bought zero token.");
        amountBought = buyQuote(msg.value.mul(99).div(100));
        dev.transfer(msg.value.div(100));
        token.transferFrom(owner(), _msgSender(), amountBought);
    }

    function bid() public view returns (uint128) {
        return price.bid;
    }

    function vendorBid() public view returns (uint amounttoken, uint amountETH) {
        // Summarizes the ETH available for purchase
        amounttoken = address(this).balance.mul(price.bid).div(10**9);
        amountETH = address(this).balance.mul(99).div(100);
    }

    function sellQuote(uint amounttoken) public view returns (uint amountETH) {
        // Converts token to ETH at the bid rate
        amountETH = price.bid == 0 ? 0 : amounttoken.mul(10**9).div(price.bid);
        require (amountETH <= address(this).balance, "Amount exceeds Bid size.");
    }

    function sellToken(uint amounttoken) public returns (uint ethToPay) {
        // Executes a sell.
        require(price.bid > 0, "Not interested.");
        require(amounttoken > 0, "Congratulations, you sold zero token.");
        ethToPay = sellQuote(amounttoken);
        token.transferFrom(_msgSender(), owner(), amounttoken);
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
