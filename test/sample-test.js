const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("VendorFactory", function () {
  it("should deploy proxy vendor from factory.", async function () {
    const accounts = await ethers.getSigners();
    const provider = ethers.provider;

    const HogeVendor = await ethers.getContractFactory("HogeVendor");
    const hogeVendor = await HogeVendor.deploy();
    await hogeVendor.deployed();

    const VendorFactory = await ethers.getContractFactory("VendorFactory");
    const vendorFactory = await VendorFactory.deploy(hogeVendor.address);
    await vendorFactory.deployed();

    const vendorAddressTxn = await vendorFactory.connect(accounts[1]).createVendor("rorih");
    const vendorCreationRcpt = await vendorAddressTxn.wait();
    const createEvent = vendorCreationRcpt.events.find(event => event.event === 'VendorCreated');
    const rorihVendorAddress = createEvent.args.vendor;    

    const vendorAddressTxn2 = await vendorFactory.connect(accounts[2]).createVendor("nick");
    const vendorCreationRcpt2 = await vendorAddressTxn2.wait();
    const createEvent2 = vendorCreationRcpt2.events.find(event => event.event === 'VendorCreated');
    const nickVendorAddress = createEvent2.args.vendor;

    console.log("factory ", vendorFactory.address);
    console.log(accounts[0].address);
    console.log(accounts[1].address);
    console.log(accounts[2].address);

    const vendor1 = await ethers.getContractAt("HogeVendor", rorihVendorAddress);
    const name = await vendor1.getName();
    expect(name).to.equal("rorih");
    const address1 = await vendor1.owner();
    expect(address1).to.equal(accounts[1].address);

    const vendor2 = await ethers.getContractAt("HogeVendor", nickVendorAddress);
    const name2 = await vendor2.getName();
    expect(name2).to.equal("nick");
    const address2 = await vendor2.owner();
    expect(address2).to.equal(accounts[2].address);
  });
});
