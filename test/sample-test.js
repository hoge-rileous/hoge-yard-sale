const { ethers } = require("hardhat");
const { expect } = require("chai");
let whitebit = "0x39F6a6C85d39d5ABAd8A398310c52E7c374F2bA3";
const erc20 = require("../contracts/erc20.json");

describe("VendorFactory", async (accounts) => {

  beforeEach(async () => {
    await hre.network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: "https://eth-mainnet.alchemyapi.io/v2/Nt69sONp5ihvwSzjtBunKFM4rJr_Ee8W",
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
    const hoge = await ethers.getContractAt(erc20, "0xfad45e47083e4607302aa43c65fb3106f1cd7607");

    const accounts = await ethers.getSigners();
    const provider = ethers.provider;

    const whitebit_signer = await ethers.getSigner(whitebit);


    const HogeVendor = await ethers.getContractFactory("HogeVendor");
    const hogeVendor = await HogeVendor.deploy();
    await hogeVendor.deployed();

    const VendorFactory = await ethers.getContractFactory("VendorFactory");
    const vendorFactory = await VendorFactory.deploy(hogeVendor.address);
    await vendorFactory.deployed();

    const bn_hoge = ethers.utils.parseUnits('100000000', 9);

    const vendorAddressTxn = await vendorFactory.connect(whitebit_signer).createVendor(bn_hoge, bn_hoge);
    const vendorCreationRcpt = await vendorAddressTxn.wait();
    const createEvent = vendorCreationRcpt.events.find(event => event.event === 'VendorCreated');
    const rorihVendorAddress = createEvent.args.vendor;    

    const vendorAddressTxn2 = await vendorFactory.connect(accounts[2]).createVendor(bn_hoge, bn_hoge);
    const vendorCreationRcpt2 = await vendorAddressTxn2.wait();
    const createEvent2 = vendorCreationRcpt2.events.find(event => event.event === 'VendorCreated');
    const nickVendorAddress = createEvent2.args.vendor;

    const vendor1 = await ethers.getContractAt("HogeVendor", rorihVendorAddress);
    const address1 = await vendor1.owner();
    expect(address1).to.equal(whitebit);

    const vendor2 = await ethers.getContractAt("HogeVendor", nickVendorAddress);
    const address2 = await vendor2.owner();
    expect(address2).to.equal(accounts[2].address);

    let hogeForSale = await vendor1.vendorAsk();
    let hogeForBuy = await vendor1.vendorBid();
    expect(hogeForSale[0]).to.equal(0);
    expect(hogeForBuy[1]).to.equal(0);
    
    //Approval step makes HOGE available for sale
    await hoge.connect(whitebit_signer).approve(vendor1.address, bn_hoge);
    hogeForSale = await vendor1.vendorAsk();
    expect(hogeForSale[0]).to.equal(bn_hoge);

    const ethValue = hogeForSale[1];
    expect(ethValue).to.equal("989898989898989898");

    const acct2_vendor1 = await vendor1.connect(accounts[2]);
    await expect(acct2_vendor1.buyHOGE({value: ethValue.add(100)}))
      .to.be.revertedWith('Not enough HOGE to complete order.');
    await acct2_vendor1.buyHOGE({value: ethValue});
    const hogeBought = await hoge.balanceOf(accounts[2].address);
    expect(hogeBought).to.equal("98000202641414841");

    hogeForSale = await vendor1.vendorAsk();
    expect(hogeForSale[0]).to.equal(1); // rounding dust

    //Top off Vendor ETH up to 1
    await whitebit_signer.sendTransaction({
      to: vendor1.address,
      value: ethers.utils.parseEther("1.0").sub(ethValue)
    });
    hogeForBuy = await vendor1.vendorBid();
    console.log(hogeForBuy);
    const hogeToSell = hogeForBuy[0];
    const ethFromSell = hogeForBuy[1];
    expect(hogeToSell).to.equal(bn_hoge.mul(99).div(98));

    //top off account 2 HOGE balance
    await hoge.connect(whitebit_signer).transfer(accounts[2].address, bn_hoge);

    await expect(acct2_vendor1.sellHOGE(hogeToSell)).to.be.revertedWith('ERC20: transfer amount exceeds allowance');
    //Seller approves HOGE on contract.
    await hoge.connect(accounts[2]).approve(vendor1.address, hogeToSell);

    const seller_bal_before_sell = await vendor1.provider.getBalance(accounts[2].address);
    const hoge_bal_before_sell = await hoge.balanceOf(accounts[2].address);
    const sell_txn = await acct2_vendor1.sellHOGE(hogeToSell);
    const sell_rcpt = await sell_txn.wait();

    const gas_cost = sell_rcpt.cumulativeGasUsed.mul(sell_rcpt.effectiveGasPrice);
    const seller_bal_after_sell = await vendor1.provider.getBalance(accounts[2].address);
    const hoge_bal_after_sell = await hoge.balanceOf(accounts[2].address);
    const gain = seller_bal_after_sell.sub(seller_bal_before_sell);
    //Ether gained is +-2 same as quoted, minus gas
    expect(gain.gte(ethFromSell.sub(gas_cost).sub(2))).to.equal(true);
  });
});