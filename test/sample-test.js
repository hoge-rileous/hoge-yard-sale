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

    const vendorAddressTxn = await vendorFactory.connect(whitebit_signer).createVendor("100000000", "100000000");
    const vendorCreationRcpt = await vendorAddressTxn.wait();
    const createEvent = vendorCreationRcpt.events.find(event => event.event === 'VendorCreated');
    const rorihVendorAddress = createEvent.args.vendor;    

    const vendorAddressTxn2 = await vendorFactory.connect(accounts[2]).createVendor("100000000", "100000000");
    const vendorCreationRcpt2 = await vendorAddressTxn2.wait();
    const createEvent2 = vendorCreationRcpt2.events.find(event => event.event === 'VendorCreated');
    const nickVendorAddress = createEvent2.args.vendor;

    const vendor1 = await ethers.getContractAt("HogeVendor", rorihVendorAddress);
    const address1 = await vendor1.owner();
    expect(address1).to.equal(whitebit);

    const vendor2 = await ethers.getContractAt("HogeVendor", nickVendorAddress);
    const address2 = await vendor2.owner();
    expect(address2).to.equal(accounts[2].address);

    let hogeForSale = await vendor1.VendorHOGEForSale();
    let hogeForBuy = await vendor1.VendorHOGEToPurchase();
    expect(hogeForSale).to.equal(0);
    expect(hogeForBuy).to.equal(0);

    //Approval step makes HOGE available for sale
    await hoge.connect(whitebit_signer).approve(vendor1.address, ethers.BigNumber.from('100000000000000000').mul(99).div(98));
    hogeForSale = await vendor1.VendorHOGEForSale();
    expect(hogeForSale).to.equal("99999999999999999");


    //Sending ETH to contract makes ETH available for trade
    await whitebit_signer.sendTransaction({
      to: vendor1.address,
      value: ethers.utils.parseEther("1.0")
    });
    hogeForBuy = await vendor1.VendorHOGEToPurchase();
    expect(hogeForBuy).to.equal("100000000000000000");

    await expect(vendor1.connect(accounts[2]).buyHOGEFromVendor({value: ethers.utils.parseEther("2.0")})).to.be.revertedWith('Not enough HOGE to complete order.');
    await vendor1.connect(accounts[2]).buyHOGEFromVendor({value: ethers.utils.parseEther(".999999999999999999")});
    const hogeBought = await hoge.balanceOf(accounts[2].address);
    expect(hogeBought).to.equal("99000206797839802");
  });
});
