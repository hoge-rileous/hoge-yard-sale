// This is a script for deploying your contracts. You can adapt it to deploy
// yours, or create new ones.
async function main() {
  // This is just a convenience check
  if (network.name === "hardhat") {
    console.warn(
      "You are trying to deploy a contract to the Hardhat Network, which" +
        "gets automatically created and destroyed every time. Use the Hardhat" +
        " option '--network localhost'"
    );
  }

  // ethers is available in the global scope
  const [deployer] = await ethers.getSigners();
  console.log(
    "Deploying the contracts with the account:",
    await deployer.getAddress()
  );

  console.log("Account balance:", (await deployer.getBalance()).toString());

    const HogeVendor = await ethers.getContractFactory("HogeVendor");
    const hogeVendor = await HogeVendor.deploy();
    await hogeVendor.deployed();
  console.log("hogeVendor address:", hogeVendor.address);

    const VendorFactory = await ethers.getContractFactory("VendorFactory");
    const vendorFactory = await VendorFactory.deploy(hogeVendor.address);
    await vendorFactory.deployed();

  console.log("factory address:", vendorFactory.address);

/*  vendors = [];
    const vendorAddressTxn = await vendorFactory.createVendor('50000000', '400000000');
    const vendorCreationRcpt = await vendorAddressTxn.wait();
    const createEvent = vendorCreationRcpt.events.find(event => event.event === 'VendorCreated');
    const vendor1Address = createEvent.args.vendor; 
    vendors.push(vendor1Address);   

    await deployer.sendTransaction({
      to: vendor1Address,
      value: ethers.utils.parseEther("1.0")
    });

    const vendor2AddressTxn = await vendorFactory.createVendor('70000000', '30000000');
    const vendor2CreationRcpt = await vendor2AddressTxn.wait();
    const createEvent2 = vendor2CreationRcpt.events.find(event => event.event === 'VendorCreated');
    const vendor2Address = createEvent2.args.vendor; 
    vendors.push(vendor2Address);   

  console.log("Vendor1 address:", vendor1Address);*/

  // We also save the contract's artifacts and address in the frontend directory
  //saveFrontendFiles(hogeVendor, vendorFactory, vendors);
  saveFrontendFiles(hogeVendor, vendorFactory, []);
}

function saveFrontendFiles(hogeVendor, vendorFactory, vendors) {
  const fs = require("fs");
  const contractsDir = __dirname + "/../hogevault-frontend/src/contracts";

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  const VendorArtifact = artifacts.readArtifactSync("HogeVendor");


  fs.writeFileSync(
    contractsDir + "/vendor-address.json",
    JSON.stringify({ address: hogeVendor.address }, undefined, 2)
  );  

  const FactoryArtifact = artifacts.readArtifactSync("VendorFactory");

  fs.writeFileSync(
    contractsDir + "/factory-address.json",
    JSON.stringify({ address: vendorFactory.address }, undefined, 2)
  );

/*  fs.writeFileSync(
    contractsDir + "/vendors.json",
    JSON.stringify({ addresses: vendors }, undefined, 2)
  );
  */
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
