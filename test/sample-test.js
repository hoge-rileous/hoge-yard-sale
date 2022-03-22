const { ethers } = require("hardhat");
const { expect } = require("chai");
let whitebit = "0x39f6a6c85d39d5abad8a398310c52e7c374f2ba3";
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
    const t = await hoge.totalSupply();
    console.log(t);
    const accounts = await ethers.getSigners();
    const provider = ethers.provider;

    const HogeVendor = await ethers.getContractFactory("HogeVendor");
    const hogeVendor = await HogeVendor.deploy();
    await hogeVendor.deployed();

    const VendorFactory = await ethers.getContractFactory("VendorFactory");
    const vendorFactory = await VendorFactory.deploy(hogeVendor.address);
    await vendorFactory.deployed();

    const vendorAddressTxn = await vendorFactory.connect(accounts[1]).createVendor("30000000", "31000000");
    const vendorCreationRcpt = await vendorAddressTxn.wait();
    const createEvent = vendorCreationRcpt.events.find(event => event.event === 'VendorCreated');
    const rorihVendorAddress = createEvent.args.vendor;    

    const vendorAddressTxn2 = await vendorFactory.connect(accounts[2]).createVendor("30000000", "31000000");
    const vendorCreationRcpt2 = await vendorAddressTxn2.wait();
    const createEvent2 = vendorCreationRcpt2.events.find(event => event.event === 'VendorCreated');
    const nickVendorAddress = createEvent2.args.vendor;

    const vendor1 = await ethers.getContractAt("HogeVendor", rorihVendorAddress);
    const address1 = await vendor1.owner();
    expect(address1).to.equal(accounts[1].address);

    const vendor2 = await ethers.getContractAt("HogeVendor", nickVendorAddress);
    const address2 = await vendor2.owner();
    expect(address2).to.equal(accounts[2].address);

    let hogeForSale = await vendor1.VendorHOGEForSale();
    let hogeForBuy = await vendor1.VendorHOGEToPurchase();
    expect(hogeForSale).to.equal(0);
    expect(hogeForBuy).to.equal(0);
  });
});
