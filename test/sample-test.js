require('dotenv').config()
const { ethers } = require("hardhat");
const { expect } = require("chai");

//LARP as whitebit because why not.
let whitebit = "0x39F6a6C85d39d5ABAd8A398310c52E7c374F2bA3";
let hogeAddr = "0xfAd45E47083e4607302aa43c65fB3106F1cd7607";
const erc20 = require("../contracts/erc20.json");

describe("VendorFactory", async (accounts) => {

  beforeEach(async () => {
    await hre.network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: process.env.alchemyAPI,
            blockNumber: 14279700,
          },
        },
      ],
    });
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [whitebit],
    });
    await hre.network.provider.send("hardhat_setBalance", [
      whitebit,
      "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
    ]);
  });


  it("should deploy proxy vendor from factory.", async function () {
    const hoge = await ethers.getContractAt(erc20, hogeAddr);

    const accounts = await ethers.getSigners();
    const provider = ethers.provider;

    const whitebit_signer = await ethers.getSigner(whitebit);


    const HogeVendor = await ethers.getContractFactory("TokenVendor");
    const hogeVendor = await HogeVendor.deploy();
    await hogeVendor.deployed();

    const VendorFactory = await ethers.getContractFactory("VendorFactory");
    const vendorFactory = await VendorFactory.deploy(hogeVendor.address);
    await vendorFactory.deployed();

    const bn_hoge = ethers.utils.parseUnits('100000000', 9);

    const vendorAddressTxn = await vendorFactory.connect(whitebit_signer).createVendor('100000000', '100000000', hogeAddr, {value:ethers.utils.parseEther("1")});
    const vendorCreationRcpt = await vendorAddressTxn.wait();
    const createEvent = vendorCreationRcpt.events.find(event => event.event === 'VendorCreated');
    const rorihVendorAddress = createEvent.args.vendor;    

    const vendorAddressTxn2 = await vendorFactory.connect(accounts[2]).createVendor(0, 0, hogeAddr);
    const vendorCreationRcpt2 = await vendorAddressTxn2.wait();
    const createEvent2 = vendorCreationRcpt2.events.find(event => event.event === 'VendorCreated');
    const nickVendorAddress = createEvent2.args.vendor;

    const vendor1 = await ethers.getContractAt("TokenVendor", rorihVendorAddress);
    const address1 = await vendor1.owner();
    expect(address1).to.equal(whitebit);

    const ask = await vendor1.ask();
    const bid = await vendor1.bid();

    const vendor2 = await ethers.getContractAt("TokenVendor", nickVendorAddress);
    const address2 = await vendor2.owner();
    expect(address2).to.equal(accounts[2].address);

    let vendorAsk = await vendor1.vendorAsk();
    let vendorBid = await vendor1.vendorBid();
    expect(vendorAsk[0]).to.equal(0);

    const hogeToSell = vendorBid[0];
    const ethFromSell = vendorBid[1];
    expect(hogeToSell).to.equal(bn_hoge);

    
    //Approval step makes HOGE available for sale
    const approve_tx = await hoge.connect(whitebit_signer).approve(vendor1.address, bn_hoge);
    await approve_tx.wait();
    vendorAsk = await vendor1.vendorAsk();
    expect(vendorAsk[0]).to.equal(bn_hoge);
    const oneEth = ethers.BigNumber.from("1000000000000000000");
    const ethValue = vendorAsk[1];
    //This is the size of the Ask in ETH
    expect(ethValue).to.equal(oneEth.mul(100).div(99));

    //Larger order does not fill.
    const acct2_vendor1 = await vendor1.connect(accounts[2]);
    await expect(acct2_vendor1.buyToken({value: ethValue.mul(101).div(100)}))
      .to.be.revertedWith("Amount exceeds Ask size.");

    //Full ask size fills
    const vendor_bal_before_buy = await vendor1.provider.getBalance(vendor1.address);
    await acct2_vendor1.buyToken({value: ethValue});
    const hogeBought = await hoge.balanceOf(accounts[2].address);
    expect(hogeBought).to.equal("98000202641414841");
    vendorAsk = await vendor1.vendorAsk();
    expect(vendorAsk[0]).to.equal(1); // rounding dust

    //Release funds back to owner
    const vendor_bal_after_buy = await vendor1.provider.getBalance(vendor1.address);
    expect(vendor_bal_after_buy).to.equal(oneEth.mul(2));
    await vendor1.connect(whitebit_signer).releaseFunds(vendor_bal_after_buy);
    const vendor_bal_after_release = await vendor1.provider.getBalance(vendor1.address);
    expect(vendor_bal_after_release).to.equal(0);

    //Top off Vendor ETH up to 1
    await whitebit_signer.sendTransaction({
      to: vendor1.address,
      value: ethers.utils.parseEther("1.0")
    });

    //top off account 2 HOGE balance
    await hoge.connect(whitebit_signer).transfer(accounts[2].address, bn_hoge);

    await expect(acct2_vendor1.sellToken(hogeToSell)).to.be.revertedWith('ERC20: transfer amount exceeds allowance');
    //Seller approves HOGE on contract.
    await hoge.connect(accounts[2]).approve(vendor1.address, hogeToSell);

    //Sell enough HOGE to clear out all ETH.
    const seller_bal_before_sell = await vendor1.provider.getBalance(accounts[2].address);
    const hoge_bal_before_sell = await hoge.balanceOf(accounts[2].address);
    //await expect(acct2_vendor1.sellToken(hogeToSell.mul(3))).to.be.revertedWith("Amount exceeds Bid size.");
    const sell_txn = await acct2_vendor1.sellToken(hogeToSell);
    const sell_rcpt = await sell_txn.wait();
    const gas_cost = sell_rcpt.cumulativeGasUsed.mul(sell_rcpt.effectiveGasPrice);
    const seller_bal_after_sell = await vendor1.provider.getBalance(accounts[2].address);
    const hoge_bal_after_sell = await hoge.balanceOf(accounts[2].address);
    const gain = seller_bal_after_sell.sub(seller_bal_before_sell);
    //Ether gained is +-2 same as quoted, minus gas

    expect(gain.gte(ethFromSell.sub(gas_cost).sub(2))).to.equal(true);

    await vendor1.connect(whitebit_signer).kill();
    await vendor1.vendorBid();
    await vendor1.vendorAsk();
  });
});