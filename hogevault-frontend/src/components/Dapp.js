import React from "react";
import { ethers } from "ethers";
import HogeVendorArtifact from "../contracts/HogeVendor.json";
import VendorFactoryArtifact from "../contracts/VendorFactory.json";
import hogeABI from "../contracts/hogeABI.json";
import { NoWalletDetected } from "./NoWalletDetected";
import { ConnectWallet } from "./ConnectWallet";
import { Loading } from "./Loading";
import { ContractButton } from "./ContractButton";
import { CreateVendor } from "./CreateVendor";
import { Vendor } from "./Vendor";
import { TransactionErrorMessage } from "./TransactionErrorMessage";
import { WaitingForTransactionMessage } from "./WaitingForTransactionMessage";
const factoryAddress = require("../contracts/factory-address.json");
const vendorAddressJSON = require("../contracts/vendors.json");
const hogeAddress = "0xfad45e47083e4607302aa43c65fb3106f1cd7607";

const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

export class Dapp extends React.Component {
  constructor(props) {
    super(props);

    this.initialState = {

      tokenData: undefined,
      selectedAddress: undefined,
      initialized: false,
      vendorAddresses:vendorAddressJSON.addresses,
      vendors:[],
      hogeBalance: ethers.BigNumber.from(0),
      ethBalance: ethers.BigNumber.from(0),
      txBeingSent: undefined,
      transactionError: undefined,
      networkError: undefined,
    };
    this.vendorContracts = [];
    this.state = this.initialState;
  }



  render() {

    const hogeBalance = ethers.utils.formatUnits(this.state.hogeBalance, 9);
    const ethBalance = ethers.utils.formatEther(this.state.ethBalance);

    let errorMsg = null
    if (this.state.transactionError) {
      if (this.state.transactionError.error && this.state.transactionError.error.message) {
        errorMsg = this.state.transactionError.error.message;
      } else {
        errorMsg = "Transaction Canceled.";
      }
    }

    return (
      <div className="p-10 h-full w-full inline-flex flex-col dark:text-gray-200 bg-gray-900 items-center justify-between gap-8">
        <div className="text-2xl text-center text-white">HOGEVault</div>

        {(window.ethereum === undefined) &&
          <div className="border bg-red-600 rounded text-center p-2 flex justify-center text-1xl flex-col items-center">
            <NoWalletDetected />
          </div>
        }

        <div className="text-center flex items-center justify-center h-full">
          <div className="h-auto font-bold p-1 bg-orange-300 rounded-xl text-black flex flex-col gap-2 items-center justify-between">
            <img src="hoge.png" alt="Hoge" />
            <div>Vendor Factory</div>
            {this.state.initialized && <CreateVendor createVendor={(bid,ask) => this._createVendor(bid, ask)} />}
          </div>
          <div className="flex items-center justify-center w-1/6"> <img className="inverted w-2/3" src="arrow.png" /></div>

          <div className="h-auto font-bold p-1 bg-cyan-200 rounded-xl text-black flex flex-col gap-2 items-center justify-between">
            <img src="hoge2.png" alt="Hoge2" />
            <div>Vendors </div>
            {this.state.vendors.map((vendor) => {
              return <Vendor {...vendor.vendorData} />})}
          </div>
        </div>
        <div className="row">
          <div className="col-12">
            {this.state.txBeingSent && (
              <WaitingForTransactionMessage txHash={this.state.txBeingSent} />
            )}
            {this.state.transactionError && (
              <TransactionErrorMessage
                message={errorMsg}
                dismiss={() => this._dismissTransactionError()}
              />
            )}
          </div>
        </div>

        {this.state.initialized ? <div className="text-center flex flex-col items-center gap-2 text text-white">
          <div className="text-sm">Using address:</div>
          <div className="text-xs w-auto break-words">
            <a className="underline" target="_blank" href={`https://etherscan.io/address/` + this.state.selectedAddress}>{this.state.selectedAddress}</a>
          </div>
          <div className="text-sm">ETH balance: {parseFloat(ethBalance).toFixed(2)}</div>
          <div className="text-sm">HOGE balance: {parseFloat(hogeBalance).toFixed(2)}</div>
        </div> : <ConnectWallet
          connectWallet={() => this._connectWallet()}
          networkError={this.state.networkError}
          dismiss={() => this._dismissNetworkError()}
        />}
        <div className="text-gray-400 text-xs text-center">
          HogeVAULT is a peer-to-peer OTC DeX allowing for trustless trades for cheap.
          <a className="underline" target="_blank" href={"https://github.com/hoge-rileous/HOGEVault"}>SOURCE</a>

</div>
      </div>
    );
  }

  componentWillUnmount() {
    this._stopPollingData();
  }

  async _connectWallet() {
    const [selectedAddress] = await window.ethereum.request({ method: 'eth_requestAccounts' });
    if (!this._checkNetwork()) {
      return;
    }

    this._initialize(selectedAddress);

    window.ethereum.on("accountsChanged", ([newAddress]) => {
      this._stopPollingData();

      if (newAddress === undefined) {
        return this._resetState();
      }

      this._initialize(newAddress);
    });

    window.ethereum.on("chainChanged", ([networkId]) => {
      this._stopPollingData();
      this._resetState();
    });
  }

  _initialize(userAddress) {
    // This method initializes the dapp

    this.setState({
      selectedAddress: userAddress,
      initialized: true
    });

    this._initializeEthers();
    this._startPollingData();
  }

  async _initializeEthers() {
    this._provider = new ethers.providers.Web3Provider(window.ethereum);


    this._factory = new ethers.Contract(
      factoryAddress.address,
      VendorFactoryArtifact.abi,
      this._provider.getSigner(0)
    );

    this._hoge = new ethers.Contract(
      hogeAddress,
      hogeABI,
      this._provider.getSigner(0)
    );


    Promise.all(
      this.state.vendorAddresses.map(async (vendorAddress, i) => {
        let contract = new ethers.Contract(
                        vendorAddress,
                        HogeVendorArtifact.abi,
                        this._provider.getSigner(0)
                      );
        let vendor = {address: vendorAddress,
                      contract: contract};
        const bid = await vendor.contract.bid();
        const ask = await vendor.contract.ask();
        const owner = await vendor.contract.owner();
        const bidMax = await vendor.contract.vendorBid();
        const askMax = await vendor.contract.vendorAsk();
        vendor.vendorData = {name: "Vendor " + String(i), 
                    owner,
                      bid, ask, bidMax, askMax};
        const buy = (ethAmount) => {this._buyHOGE(contract, ethAmount)};
        const sell = (hogeAmount) => {this._sellHOGE(contract, hogeAmount)};
        vendor.vendorData.callbacks = {buy, sell};
        return vendor;
      })).then((newVendors => {
        this.setState({vendors: newVendors});
      }));
  }

  async _buyHOGE(contract, amountETH) {
    try {

      this._dismissTransactionError();

      amountETH = ethers.utils.parseEther(amountETH);
      const tx = await contract.buyHOGE({value:amountETH});

      this.setState({ txBeingSent: tx.hash });

      const receipt = await tx.wait();
      console.log(receipt);
      if (receipt.status === 0) {
        throw new Error("Transaction failed");
      }
      await this._updateBalances();
    } catch (error) {
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
        return;
      }

      console.error(error);
      this.setState({ transactionError: error });
    } finally {
      this.setState({ txBeingSent: undefined });
    }
  }

  async _sellHOGE(contract, amountHOGE) {
    try {

      this._dismissTransactionError();

      amountHOGE = ethers.utils.parseUnits(amountHOGE, 9);

      const allowance = await this._hoge.allowance(this.state.selectedAddress, contract.address);
      console.log(allowance.toString());
      console.log(amountHOGE.toString())
      if (amountHOGE.gt(allowance)) {
        await this._approveHoge(contract);
      }

      const tx = await contract.sellHOGE(amountHOGE);

      this.setState({ txBeingSent: tx.hash });

      const receipt = await tx.wait();
      console.log(receipt);
      if (receipt.status === 0) {
        throw new Error("Transaction failed");
      }
      await this._updateBalances();
    } catch (error) {
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
        return;
      }

      console.error(error);
      this.setState({ transactionError: error });
    } finally {
      this.setState({ txBeingSent: undefined });
    }
  }

  async _createVendor(bid,ask) {
    try {

      this._dismissTransactionError();

      bid = ethers.utils.parseUnits(bid, 0);
      ask = ethers.utils.parseUnits(ask, 0);


      const tx = await this._factory.createVendor(bid, ask);
      this.setState({ txBeingSent: tx.hash });


      const receipt = await tx.wait();
      console.log(receipt);
      if (receipt.status === 0) {
        throw new Error("Transaction failed");
      }
      await this._updateBalances();
    } catch (error) {
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
        return;
      }

      console.error(error);
      this.setState({ transactionError: error });
    } finally {
      this.setState({ txBeingSent: undefined });
    }
  }

  async _approveHoge(contract) {
    try {

      this._dismissTransactionError();
      const amount = ethers.constants.MaxUint256;
      const tx = await this._hoge.approve(contract.address, amount);
      this.setState({ txBeingSent: tx.hash });

      const receipt = await tx.wait();
      if (receipt.status === 0) {
        throw new Error("Transaction failed");
      }
      await this._updateBalances();
    } catch (error) {
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
        return;
      }

      console.error(error);
      this.setState({ transactionError: error });
    } finally {
      this.setState({ txBeingSent: undefined });
    }
  }


  _startPollingData() {
    this._pollDataInterval = setInterval(() => this._updateBalances(), 1000);
    this._updateBalances();
  }

  _stopPollingData() {
    clearInterval(this._pollDataInterval);
    this._pollDataInterval = undefined;
  }

  async _updateBalances() {
    const hogeBalance = await this._hoge.balanceOf(this.state.selectedAddress);
    const ethBalance = await ethers.getDefaultProvider().getBalance(this.state.selectedAddress);

    this.setState({
      hogeBalance,
      ethBalance,
    });
  }

  // This method just clears part of the state.
  _dismissTransactionError() {
    this.setState({ transactionError: undefined });
  }

  // This method just clears part of the state.
  _dismissNetworkError() {
    this.setState({ networkError: undefined });
  }

  // This is an utility method that turns an RPC error into a human readable
  // message.
  _getRpcErrorMessage(error) {
    if (error.data) {
      return error.data.message;
    }
    return error.message;
  }

  // This method resets the state
  _resetState() {
    this.setState(this.initialState);
  }

  // This method checks if Metamask selected network is Localhost:8545 
  _checkNetwork() {
    console.log(window.ethereum.networkVersion);
    return true;
    const netv = window.ethereum.networkVersion;
    if (netv === "1" || netv === 1) {
      return true;
    }

    this.setState({
      networkError: 'Please connect Metamask to ETH MAINNET'
    });

    return false;
  }
}
